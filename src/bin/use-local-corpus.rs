#![allow(unused_imports, unused_variables, dead_code)]

#[macro_use]
extern crate tantivy;
use std::thread;
use std::time::{Duration, Instant};

use content_caching::get_history;
use fs_extra::dir::get_size;
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::Index;
use tantivy::ReloadPolicy;
use tantivy::Snippet;
use tantivy::SnippetGenerator;
use tempfile::TempDir;
use textwrap::indent;

use dialoguer::{theme::ColorfulTheme, Input};

const BLACK: &str = "\u{001b}[30m";
const RED: &str = "\u{001b}[31m";
const GREEN: &str = "\u{001b}[32m";
const YELLOW: &str = "\u{001b}[33m";
const BLUE: &str = "\u{001b}[34m";
const MAGENTA: &str = "\u{001b}[35m";
const CYAN: &str = "\u{001b}[36m";
const WHITE: &str = "\u{001b}[37m";
const RESET: &str = "\u{001b}[0m";

fn main() -> tantivy::Result<()> {
    let index_path = TempDir::new()?;
    println!("Created a temp dir {:?}", index_path);

    let mut schema_builder = Schema::builder();
    schema_builder.add_text_field("url", TEXT | STORED);
    schema_builder.add_text_field("title", TEXT | STORED);
    schema_builder.add_text_field("description", TEXT | STORED);
    schema_builder.add_text_field("content", TEXT | STORED);

    let schema = schema_builder.build();
    println!("The schema is built.");

    let index = Index::create_in_dir(&index_path, schema.clone())?;
    let mut index_writer = index.writer(50_000_000)?;

    let url = schema.get_field("url").unwrap();
    let title = schema.get_field("title").unwrap();
    let description = schema.get_field("description").unwrap();
    let content = schema.get_field("content").unwrap();

    let mut document_count = 0;
    // Read through all of the files.
    for history in get_history() {
        println!("Getting all scraped content for: {}", history.host);
        for entry in &history.entries {
            if let Some(string) = entry.read_content(&history.host) {
                document_count += 1;
                // rust-fmt: off
                index_writer.add_document(doc!(
                    url => entry.url.clone(),
                    title => entry.title.clone().unwrap_or_default().to_string(),
                    description => entry.description.clone().unwrap_or_default(),
                    content => string
                ))?;
            }
        }
        println!("");
    }

    println!("Indexing the content.");
    let now = Instant::now();
    index_writer.commit()?;

    println!(
        "{} documents index in {} seconds",
        document_count,
        now.elapsed().as_secs()
    );
    println!(
        "Size of index: {}mb",
        get_size(index_path).expect("Unable to get dir size.") / 1024 / 1024
    );

    // FIXME: Guard against:
    // Error: OpenReadError(FileDoesNotExist("meta.json"))
    thread::sleep(Duration::from_millis(500));

    println!("Preparing the reader.");
    let reader = index
        .reader_builder()
        .reload_policy(ReloadPolicy::OnCommit)
        .try_into()?;

    // Ask the user to search for it.
    loop {
        println!("\n\n\n\n");
        let search_string: String = Input::with_theme(&ColorfulTheme::default())
            .with_prompt("Search")
            .interact_text()
            .unwrap();

        let searcher = reader.searcher();
        let query_parser = QueryParser::for_index(&index, vec![title, content]);

        let query = query_parser.parse_query(&search_string)?;

        let top_docs = searcher.search(&query, &TopDocs::with_limit(5))?;

        let snippet_generator = SnippetGenerator::create(&searcher, &*query, content)?;

        for (score, doc_address) in top_docs {
            let doc = searcher.doc(doc_address)?;
            let snippet = snippet_generator.snippet_from_doc(&doc);
            println!("\n\n┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
            println!(
                "{}│ {}{}",
                WHITE,
                doc.get_first(title).unwrap().as_text().unwrap(),
                RESET
            );
            println!(
                "{}│ {}{}",
                CYAN,
                doc.get_first(url).unwrap().as_text().unwrap(),
                RESET
            );
            println!("│ {}Score: {}{}", YELLOW, RESET, score);
            println!("├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────");
            println!("{}", highlight(snippet));
            println!("└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────\n");
        }

        println!("You searched for {:?}", search_string);
    }
}

fn highlight(snippet: Snippet) -> String {
    let mut result = String::new();
    let mut start_from = 0;

    for fragment_range in snippet.highlighted() {
        result.push_str(&snippet.fragment()[start_from..fragment_range.start]);
        result.push_str(RED);
        result.push_str(&snippet.fragment()[fragment_range.clone()]);
        result.push_str(RESET);
        start_from = fragment_range.end;
    }

    result.push_str(&snippet.fragment()[start_from..]);
    indent(&result, "│   ")
}
