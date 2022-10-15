use actix_files::NamedFile;
use actix_web::{get, http::header, web::Path, HttpResponse, Responder};
use askama::Template;

#[derive(askama::Template)]
#[template(path = "audio.html")]
struct AudioTemplate<'a> {
    file: &'a str,
}

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
#[error("Couldn't render: {0}")]
#[status(500)]
pub struct TemplateError(#[from] askama::Error);

#[get("/a/{name}")]
pub async fn audio_template(path: Path<String>) -> Result<HttpResponse, TemplateError> {
    let rendered = AudioTemplate {
        file: &format!("/{path}"),
    }
    .render()?;
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .insert_header((header::CACHE_CONTROL, "max-age=3600"))
        .body(rendered))
}

#[get("/t/{name}")]
pub async fn text_template() -> impl Responder {
    NamedFile::open_async("./static/pages/text/text.html").await
}
