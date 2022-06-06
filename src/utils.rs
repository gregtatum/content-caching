use serde::Deserialize;
use std::{ffi::OsStr, fs, io::Read, path::PathBuf};

#[derive(Debug, Deserialize)]
pub struct HistoryEntry {
    pub url: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub url_hash: u64,
}

impl HistoryEntry {
    pub fn content_path(&self, host: &str) -> PathBuf {
        let hash = format!("{:x}", self.url_hash);

        let mut path = PathBuf::from("./data/text/");
        path.push(format!("{}-{}.txt", hash, host));
        path
    }

    /// Reads the contents if they have been scraped.
    pub fn read_content(&self, host: &str) -> Option<String> {
        let path = self.content_path(host);
        if !path.exists() {
            print!("□");
            return None;
        }
        print!("■");
        let mut file = fs::File::open(path).expect("Failed to read file.");
        let mut string = String::new();
        file.read_to_string(&mut string)
            .expect("Failed to read string.");

        Some(string)
    }
}

#[derive(Debug)]
pub struct HostHistory {
    pub host: String,
    pub entries: Vec<HistoryEntry>,
}

pub fn get_history() -> Vec<HostHistory> {
    let mut host_history: Vec<HostHistory> = vec![];
    for entry in fs::read_dir("./data/list").unwrap() {
        let path = entry.expect("Failed to read file entry").path();
        let extension = path.extension().and_then(OsStr::to_str);
        if extension != Some("json") {
            continue;
        }
        println!("Loading {}", path.display());
        let mut file = fs::File::open(path.clone()).expect("Failed to read file.");
        let mut data = String::new();
        file.read_to_string(&mut data)
            .expect("Failed to read string.");

        let host = path
            .file_stem()
            .expect("Failed to get the file stem")
            .to_str()
            .expect("Failed to convert host name to string.");

        host_history.push(HostHistory {
            host: host.into(),
            entries: serde_json::from_str(&data).expect("JSON was not well-formatted"),
        });
    }
    host_history
}

#[test]
fn test_get_dirs() {
    get_history();
}

#[test]
fn test_get_content() {
    let history = get_history();
    let host_history = history.first().unwrap();
    let entry: &HistoryEntry = host_history.entries.first().unwrap();

    entry.read_content(&host_history.host);
}
