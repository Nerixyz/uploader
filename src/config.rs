use std::{fmt::Formatter, path::PathBuf};

use base64::Engine;
use hmac::{
    digest::{crypto_common::KeySizeUser, generic_array::GenericArray, Key},
    Hmac,
};
use once_cell::sync::Lazy;
use serde::{
    de::{Error, Visitor},
    Deserialize, Deserializer,
};
use sha2::Sha224;

type Secret = Key<Hmac<Sha224>>;

#[derive(Deserialize)]
pub struct Config {
    pub bind: String,
    pub file_dir: PathBuf,
    pub domain: String,
    pub authorization: String,
    #[serde(deserialize_with = "from_base64")]
    pub secret: Secret,
}

pub static CONFIG: Lazy<Config> = Lazy::new(|| {
    toml::from_str(
        &std::fs::read_to_string("config.toml")
            .expect("A config.toml must be in the working directory"),
    )
    .expect("The config.toml must be valid")
});

fn from_base64<'de, D>(de: D) -> Result<Secret, D::Error>
where
    D: Deserializer<'de>,
{
    struct Base64Visitor;
    impl Visitor<'_> for Base64Visitor {
        type Value = Secret;

        fn expecting(&self, f: &mut Formatter) -> std::fmt::Result {
            write!(f, "a base64 string")
        }

        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: Error,
        {
            let mut arr = GenericArray::<u8, <Hmac<Sha224> as KeySizeUser>::KeySize>::default();
            base64::engine::general_purpose::STANDARD
                .decode_slice(v, &mut arr[..])
                .map_err(|e| E::custom(e))?;
            Ok(arr)
        }
    }
    de.deserialize_str(Base64Visitor)
}
