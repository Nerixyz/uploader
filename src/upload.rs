use std::{
    fmt, io,
    path::Path,
    pin::Pin,
    task::{Context, Poll},
};

use actix_web::{
    error::PayloadError,
    http::header::ContentType,
    web::{Header, Payload},
    HttpRequest, HttpResponse,
};
use bytes::{Bytes, BytesMut};
use futures::{Stream, StreamExt};
use serde::Serialize;
use tokio::io::AsyncWriteExt;
use tracing::warn;

use crate::{config::CONFIG, deletion, rng};

// <=> Used when uploading from the homepage.
const FILENAME_POST_HEADER: &str = "X-Upload-Filename";

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
pub enum MultipartError {
    #[error("No field found")]
    #[status(400)]
    NoEntry,
    #[error("{0}")]
    #[status(400)]
    Multer(multer::Error),
    #[error("Upload error: {0}")]
    #[status(500)]
    Upload(UploadError<multer::Error>),
}

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
pub enum PostError {
    #[error("Upload error: {0}")]
    #[status(500)]
    Upload(UploadError<PayloadError>),
}

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
#[status(500)]
pub enum UploadError<E: fmt::Display + fmt::Debug> {
    #[error("Io-Error")]
    Io(io::Error),
    #[error("{0}")]
    Inner(E),
}

#[derive(Serialize)]
pub struct UploadResponse {
    link: String,
    deletion_link: String,
}

#[derive(Copy, Clone, Eq, PartialEq)]
enum TypeHint {
    None,
    Audio,
    Text,
}

pub async fn upload_multipart(
    body: Payload,
    ct: Header<ContentType>,
) -> Result<HttpResponse, MultipartError> {
    let boundary = multer::parse_boundary(ct.as_ref()).map_err(MultipartError::Multer)?;
    let mut mp = multer::Multipart::new(UnsafePayload(body), boundary);
    match mp.next_field().await.map_err(MultipartError::Multer)? {
        Some(mut field) => {
            let filename = field.file_name().map(|f| f.to_owned());
            let ct = field.content_type().cloned();
            inner_upload(&mut field, ct.as_ref(), filename.as_ref().map(Path::new))
                .await
                .map_err(MultipartError::Upload)
        }
        None => Err(MultipartError::NoEntry),
    }
}

pub async fn upload_post(
    mut body: Payload,
    h: Option<Header<ContentType>>,
    req: HttpRequest,
) -> Result<HttpResponse, PostError> {
    let mime = h.map(|h| h.0 .0);
    let filename = req
        .headers()
        .get(FILENAME_POST_HEADER)
        .and_then(|h| h.to_str().ok())
        .map(Path::new);
    inner_upload(&mut body, mime.as_ref(), filename)
        .await
        .map_err(PostError::Upload)
}

async fn inner_upload<S, E>(
    stream: &mut S,
    content_type: Option<&mime::Mime>,
    upload_filename: Option<&Path>,
) -> Result<HttpResponse, UploadError<E>>
where
    S: Stream<Item = Result<Bytes, E>> + Unpin,
    E: fmt::Debug + fmt::Display,
{
    let mut filename = rng::generate_name();
    filename.push('.');
    let (extension, ty, initial_buf) = determine_extension(stream, content_type).await?;
    // Check if the user provided a filename, and try to use its extension.
    // However, we still check the expected extension, because we want to determine the filetype,
    // so we can return an enhanced page.
    if let Some(f) = upload_filename
        .and_then(|p| p.extension())
        .and_then(|s| s.to_str())
    {
        // overwritten extension
        filename.push_str(f);
    } else {
        // determined extension
        filename.push_str(extension);
    }

    let file_path = CONFIG.file_dir.join(&filename);
    let res = async move /* try */ {
        let mut file = tokio::fs::File::create(file_path)
            .await
            .map_err(UploadError::Io)?;

        if let Some(buf) = initial_buf {
            file.write_all(&buf).await.map_err(UploadError::Io)?;
        }

        while let Some(item) = stream.next().await {
            let item = item.map_err(UploadError::Inner)?;
            file.write_all(&item).await.map_err(UploadError::Io)?;
        }

        Ok(())
    }
    .await;

    match res {
        Ok(_) => Ok(HttpResponse::Ok().json(UploadResponse {
            link: match ty {
                TypeHint::None => format!("{}/{filename}", CONFIG.domain),
                TypeHint::Audio => format!("{}/a/{filename}", CONFIG.domain),
                TypeHint::Text => format!("{}/t/{filename}", CONFIG.domain),
            },
            deletion_link: format!(
                "{}/d/{filename}/{}",
                CONFIG.domain,
                deletion::make_key(&filename)
            ),
        })),
        Err(e) => {
            warn!(error = ?e, "Couldn't upload");
            Err(e)
        }
    }
}

async fn determine_extension<S, E>(
    stream: &mut S,
    content_type: Option<&mime::Mime>,
) -> Result<(&'static str, TypeHint, Option<Bytes>), UploadError<E>>
where
    S: Stream<Item = Result<Bytes, E>> + Unpin,
    E: fmt::Debug + fmt::Display,
{
    if let Some((e, ty)) = content_type.and_then(extension_from_mime) {
        return Ok((e, ty, None));
    }
    let mut bytes = None; // this doesn't allocate
    let maybe = loop {
        match stream.next().await {
            Some(Ok(item)) => {
                match bytes {
                    None => {
                        // this should be more common
                        match infer::get(&item) {
                            Some(ty) => {
                                return Ok((ty.extension(), type_hint_from_infer(&ty), Some(item)));
                            }
                            None => {
                                bytes = Some(BytesMut::from(item.as_ref()));
                            }
                        }
                    }
                    Some(ref mut buf) => {
                        buf.extend_from_slice(&item);
                        match infer::get(buf) {
                            Some(ty) => break Some((ty.extension(), type_hint_from_infer(&ty))),
                            None if buf.len() > 256 => {
                                break None;
                            }
                            _ => (),
                        }
                    }
                }
            }
            Some(Err(e)) => {
                // discard everything
                return Err(UploadError::Inner(e));
            }
            None => {
                // until now we couldn't determine the type
                break None;
            }
        }
    };

    match maybe {
        Some((ty, hint)) => Ok((ty, hint, bytes.map(BytesMut::freeze))),
        None => match bytes {
            Some(bytes) => {
                if std::str::from_utf8(&bytes).is_ok() {
                    Ok(("txt", TypeHint::Text, Some(bytes.freeze())))
                } else {
                    Ok(("bin", TypeHint::None, Some(bytes.freeze())))
                }
            }
            None => Err(UploadError::Io(io::Error::from(
                io::ErrorKind::UnexpectedEof,
            ))),
        },
    }
}

fn extension_from_mime(mime: &mime::Mime) -> Option<(&'static str, TypeHint)> {
    (mime.type_().as_str() == "*" || mime.subtype().as_str() == "*")
        .then_some(mime)
        .and_then(|mime| mime_guess::get_extensions(mime.type_().as_str(), mime.subtype().as_str()))
        .filter(
            |ext| !ext.is_empty() && ext.len() > 10, // basic heuristic for too many extensions
        )
        .and_then(|ext| ext.last().copied())
        .map(|e| (e, type_hint_from_mime(mime.type_().as_str())))
}

fn type_hint_from_mime(ty: &str) -> TypeHint {
    if ty == mime::AUDIO.as_str() {
        TypeHint::Audio
    } else if ty == mime::TEXT.as_str() {
        TypeHint::Text
    } else {
        TypeHint::None
    }
}

fn type_hint_from_infer(inf: &infer::Type) -> TypeHint {
    if inf.mime_type().starts_with(mime::AUDIO.as_str()) {
        TypeHint::Audio
    } else if inf.mime_type().starts_with(mime::TEXT.as_str()) {
        TypeHint::Text
    } else {
        TypeHint::None
    }
}

struct UnsafePayload(Payload);

unsafe impl Send for UnsafePayload {}

impl Stream for UnsafePayload {
    type Item = <Payload as Stream>::Item;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        Pin::new(&mut self.0).poll_next(cx)
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        self.0.size_hint()
    }
}
