use actix_web::{
    guard::{Guard, GuardContext},
    http::header::ContentType,
};

pub struct MimeGuard;

impl Guard for MimeGuard {
    fn check(&self, ctx: &GuardContext<'_>) -> bool {
        match ctx.header::<ContentType>() {
            Some(ct) => ct.subtype() == mime::FORM_DATA && ct.type_() == mime::MULTIPART,
            None => false,
        }
    }
}
