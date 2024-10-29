use std::future::{ready, Ready};

use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use constant_time_eq::constant_time_eq;
use futures::future::Either;

pub struct AuthRequirement {
    key: &'static str,
}

#[derive(Debug, thiserror::Error, actix_web_error::Json)]
pub enum AuthError {
    #[error("No 'Authorization' header specified")]
    #[status(400)]
    NoHeader,
    #[error("Invalid authorization")]
    #[status(401)]
    BadAuth,
}

impl AuthRequirement {
    pub fn new(key: &'static str) -> Self {
        Self { key }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthRequirement
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Transform = AuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(Self::Transform {
            service,
            key: self.key,
        }))
    }
}

pub struct AuthMiddleware<S> {
    service: S,
    key: &'static str,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = Either<Ready<Result<Self::Response, Self::Error>>, S::Future>;

    actix_web::dev::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let header = req.headers().get("authorization");
        let header = match header {
            Some(h) => h,
            None => return Either::Left(ready(Err(AuthError::NoHeader.into()))),
        };
        if constant_time_eq(header.as_bytes(), self.key.as_bytes()) {
            Either::Right(self.service.call(req))
        } else {
            Either::Left(ready(Err(AuthError::BadAuth.into())))
        }
    }
}
