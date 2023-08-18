use std::time::Duration;

use crate::{args::FileMetric, config::CONFIG};

pub fn clean(duration: Duration, dry_run: bool, metric: FileMetric) -> std::io::Result<()> {
    let mut removed = 0usize;

    let now = std::time::SystemTime::now();
    for entry in std::fs::read_dir(&CONFIG.file_dir)? {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                eprintln!("Failed to read entry in directory, skipping: {e}");
                continue;
            }
        };

        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(e) => {
                eprintln!(
                    "Failed to read metadata of {}, skipping: {e}",
                    entry.file_name().to_string_lossy()
                );
                continue;
            }
        };
        if !meta.file_type().is_file() {
            eprintln!(
                "{} is not a file, skipping",
                entry.file_name().to_string_lossy()
            );
            continue;
        }

        let file_time = match metric.extract(&meta) {
            Ok(t) => t,
            Err(e) => {
                eprintln!(
                    "Failed to read time of {}, skipping: {e}",
                    entry.file_name().to_string_lossy()
                );
                continue;
            }
        };
        if now - duration > file_time {
            match dry_run {
                true => {
                    println!("Removing {}", entry.file_name().to_string_lossy());
                    removed += 1;
                }
                false => {
                    if let Err(e) = std::fs::remove_file(entry.path()) {
                        eprintln!(
                            "Failed to remove {}: {e}",
                            entry.file_name().to_string_lossy()
                        );
                    } else {
                        removed += 1;
                    }
                }
            }
        }
    }

    println!("Removed {removed} file(s).");

    Ok(())
}
