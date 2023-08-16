use std::io;

use actix_files::NamedFile;
use actix_web::{delete, get, web, HttpResponse, Responder};
use base64::{
    engine::{
        general_purpose::{GeneralPurpose, GeneralPurposeConfig},
        DecodePaddingMode,
    },
    Engine,
};
use hmac::{Hmac, Mac};
use sha2::Sha224;

use crate::config::CONFIG;

type HmacSha224 = Hmac<Sha224>;

const DELETION_KEY_ENGINE: GeneralPurpose = GeneralPurpose::new(
    &base64::alphabet::URL_SAFE,
    GeneralPurposeConfig::new()
        .with_encode_padding(false)
        .with_decode_padding_mode(DecodePaddingMode::Indifferent),
);

pub fn make_key(link: &str) -> String {
    let mut mac = HmacSha224::new(&CONFIG.secret);
    mac.update(link.as_bytes());
    let bytes = mac.finalize().into_bytes();
    let mut buf = String::with_capacity(38);
    DELETION_KEY_ENGINE.encode_string(bytes, &mut buf);
    buf
}

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
pub enum DeletionError {
    #[error("Your key is invalid")]
    #[status(401)]
    InvalidKey,
    #[error("This file doesn't exist")]
    #[status(404)]
    NotFound,
    #[error("Internal error: {0}")]
    #[status(500)]
    IoError(io::Error),
}

#[delete("/d/{filename}/{key}")]
pub async fn service(path: web::Path<(String, String)>) -> Result<HttpResponse, DeletionError> {
    let (filename, key) = path.into_inner();
    if !check_key(&filename, &key) || filename.starts_with('.') {
        return Err(DeletionError::InvalidKey);
    }
    match tokio::fs::remove_file(&CONFIG.file_dir.join(filename)).await {
        Ok(_) => Ok(HttpResponse::NoContent().finish()),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Err(DeletionError::NotFound),
        Err(e) => Err(DeletionError::IoError(e)),
    }
}

#[get("/d/{filename}/{key}")]
pub async fn view() -> impl Responder {
    NamedFile::open_async("./static/pages/delete/delete.html").await
}

fn check_key(link: &str, key: &str) -> bool {
    if key.len() != 38 {
        return false;
    }

    let mut dec = [0; 32];
    let dec_len = match DELETION_KEY_ENGINE.decode_slice(key, &mut dec) {
        Ok(l) => l,
        Err(_) => return false,
    };

    let mut mac = HmacSha224::new(&CONFIG.secret);
    mac.update(link.as_bytes());
    let bytes = mac.finalize().into_bytes();

    bytes[..] == dec[..dec_len]
}
