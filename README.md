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
# You can use anything here really.
# Make sure the header is sufficiently long.
authorization = "Bearer <token>"
# Base64, Used for deletion links
# Must be 28bytes (224bit) long
# Use e.g. `openssl rand -base64 28` to generate
secret = "..."
```

- Build/Run the project `cargo b -r` or `cargo r -r`

### Cleaning

To clean files, use the `clean` subcommand - `cargo r -r -- clean`:

```text
$ cargo r -r -- clean --help
Clean the oldest files

Usage: uploader clean [OPTIONS]

Options:
  -a, --max-age <MAX_AGE>  Files older than this age will be removed [default: 1y]
      --dry-run            Don't remove files, print them to stdout
  -m, --metric <METRIC>    Which metric of a file to use to determine its age [default: modified] [possible values: accessed, modified, created]
  -h, --help               Print help
```

## Usage

You can upload either by sending a `multipart/form-data` request to `/upload` (the first field will be used) or by sending a `POST` request to `/upload`.
In both cases a valid `Authorization` header must be used.

## Uploader Configuration

### ShareX

Use the following ShareX config and replace `{config.domain}` and `{config.authorization}` with the respective values from your [`config.toml`](#building-and-running):

```json
{
  "Version": "14.1.0",
  "Name": "Uploader",
  "DestinationType": "ImageUploader, TextUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "{config.domain}/upload",
  "Headers": {
    "Authorization": "{config.authorization}"
  },
  "Body": "MultipartFormData",
  "FileFormName": "file",
  "URL": "{json:link}",
  "DeletionURL": "{json:deletion_link}"
}
```

### Chatterino

Use the following configuration and replace `{config.domain}` and `{config.authorization}` with the respective values from your [`config.toml`](#building-and-running):

```json
{
  "external": {
    "imageUploader": {
      "enabled": true,
      "url": "{config.domain}/upload",
      "formField": "file",
      "headers": "Authorization: {config.authorization}",
      "link": "{link}",
      "deletionLink": "{deletion_link}"
    }
  }
}
```

<details>
<summary>Screenshot</summary>

![](https://user-images.githubusercontent.com/19953266/208187827-37564bf8-7dd3-48a2-9f7a-c007413249c0.png)

</details>

## Upload Response

```typescript
type UploadResponse =
  | {
      error: string;
    }
  | {
      link: string;
      deletion_link: string;
    };
```

## Screenshots

### Home

<img src="https://user-images.githubusercontent.com/19953266/195892956-0cb2bb14-f81d-4378-8ea6-97d8d02c2570.png" height="300px"/>

### Text View

<img src="https://user-images.githubusercontent.com/19953266/195894115-654a7661-9d10-4c09-bac7-c1ba0d20053c.png" height="300px"/>

### Audio View

<img src="https://user-images.githubusercontent.com/19953266/195894521-d1910407-54e6-412c-98af-e714ec6647e6.png" height="300px"/>
