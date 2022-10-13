use std::future::Future;
use actix_cors::Cors;
use actix_files::{Files, NamedFile};
use actix_web::{body::MessageBody, dev::{ServiceRequest, ServiceResponse}, http, http::{header, StatusCode}, web, App, HttpServer, Responder, get};
use actix_web::dev::fn_service;
use actix_web_lab::middleware::{from_fn, Next};
use tracing::info;
use tracing::level_filters::LevelFilter;
use tracing_actix_web::TracingLogger;
use tracing_subscriber::EnvFilter;

use crate::{
    auth::AuthRequirement,
    config::CONFIG,
    guards::MimeGuard,
    templates::{audio_template, text_template},
    upload::{upload_multipart, upload_post},
};

mod auth;
mod config;
mod guards;
mod rng;
mod templates;
mod upload;

fn not_found_svc(req: ServiceRequest) -> impl Future<Output = Result<ServiceResponse, actix_web::Error>> {
    async move {
        let (req, _) = req.into_parts();
        let file = NamedFile::open_async("./static/404.html").await?;
        let mut res = file.into_response(&req);
        *res.status_mut() = StatusCode::NOT_FOUND;
        Ok(ServiceResponse::new(req, res))
    }
}

fn not_found_svc_short(req: ServiceRequest) -> impl Future<Output = Result<ServiceResponse, actix_web::Error>> {
    async move {
        let (req, _) = req.into_parts();
        let file = NamedFile::open_async("./static/404.html").await?.use_etag(false);
        let mut res = file.into_response(&req);
        *res.status_mut() = StatusCode::NOT_FOUND;
        Ok(ServiceResponse::new(req, res))
    }
}

#[get("/")]
async fn index() -> impl Responder {
    NamedFile::open_async("./static/home.html").await
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .init();

    std::fs::create_dir_all(&CONFIG.file_dir).unwrap();

    HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allowed_headers(&[header::ACCEPT, header::CONTENT_TYPE])
                    .allowed_methods([http::Method::GET])
                    .max_age(60 * 60),
            )
            .wrap(TracingLogger::default())
            .service(
                web::resource("/upload")
                    .app_data(web::PayloadConfig::new(1024 * 1024 * 100)) // 100MB
                    .wrap(AuthRequirement::new(&CONFIG.authorization))
                    .route(web::post().guard(MimeGuard).to(upload_multipart))
                    .route(web::post().to(upload_post)),
            )
            .service(
                Files::new("/static", "static")
                    .use_etag(false)
                    .default_handler(fn_service(not_found_svc)),
            )
            .service(audio_template)
            .service(text_template)
            .service(index)
            .service(
                Files::new("/", &CONFIG.file_dir)
                    .use_etag(true)
                    .use_last_modified(true)
                    .prefer_utf8(true)
                    .default_handler(fn_service(not_found_svc_short)),
            )
    })
    .bind(&CONFIG.bind)?
    .run()
    .await
}
