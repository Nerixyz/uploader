# uploader

This is a very basic (private) file uploader and (public) host that's still in development.
You can only upload files with a key specified in the config,
but everyone can open the link.

## Notable Features

* Filetypes are automatically inferred
* Special views for text and audio files

## Building and Running

* Create a `config.toml` and configure your instance:

```toml
bind = "127.0.0.1:4833"
file_dir = "uploads"
domain = "https://i.nerixyz.de"
authorization = "Bearer <token>"
```

* Build/Run the project `cargo b -r` or `cargo r -r`
