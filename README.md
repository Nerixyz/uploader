# uploader

This is a very basic (private) file uploader and (public) host that's still in development.
You can only upload files with a key specified in the config,
but everyone can open the link.

## Notable Features

- Filetypes are automatically inferred
- Special views for text and audio files

## Building and Running

- Create a `config.toml` and configure your instance:

```toml
bind = "127.0.0.1:4833"
file_dir = "uploads"
domain = "https://i.nerixyz.de"
authorization = "Bearer <token>"
```

- Build/Run the project `cargo b -r` or `cargo r -r`

## Usage

You can upload either by sending a `multipart/form-data` request to `/upload` (the first field will be used) or by sending a `POST` request to `/upload`.
In both cases a valid `Authorization` header must be used.

## Screenshots

### Home

<img src="https://user-images.githubusercontent.com/19953266/195892956-0cb2bb14-f81d-4378-8ea6-97d8d02c2570.png" height="300px"/>

### Text View

<img src="https://user-images.githubusercontent.com/19953266/195894115-654a7661-9d10-4c09-bac7-c1ba0d20053c.png" height="300px"/>

### Audio View

<img src="https://user-images.githubusercontent.com/19953266/195894521-d1910407-54e6-412c-98af-e714ec6647e6.png" height="300px"/>



