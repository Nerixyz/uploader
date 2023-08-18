use crate::clean;

#[derive(clap::Parser)]
#[command(author, version, about)]
pub struct Args {
    #[command(subcommand)]
    pub cmd: Option<Command>,
}

#[derive(clap::Subcommand)]
pub enum Command {
    Clean {
        #[arg(short = 'a', long, default_value = "1y")]
        max_age: humantime::Duration,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
        #[arg(short = 'm', long, default_value = "modified")]
        metric: FileMetric,
    },
}

#[derive(clap::ValueEnum, Clone, Copy, PartialEq, Eq)]
pub enum FileMetric {
    Accessed,
    Modified,
    Created,
}

impl FileMetric {
    pub fn extract(&self, meta: &std::fs::Metadata) -> std::io::Result<std::time::SystemTime> {
        match self {
            FileMetric::Accessed => meta.accessed(),
            FileMetric::Modified => meta.modified(),
            FileMetric::Created => meta.created(),
        }
    }
}

impl Command {
    pub fn run(&self) -> std::io::Result<()> {
        match self {
            Command::Clean {
                max_age,
                dry_run,
                metric,
            } => clean::clean(**max_age, *dry_run, *metric),
        }
    }
}
