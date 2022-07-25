/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

// Docs: https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import Database from 'better-sqlite3';
import * as fs from 'fs';
import {
  getAllFromHost,
  getFileSize,
  getJSON,
  getTableNames,
  sql,
} from './utils.js';
import inquirer from 'inquirer';

const BLACK = '\u001b[30m';
const RED = '\u001b[31m';
const GREEN = '\u001b[32m';
const YELLOW = '\u001b[33m';
const BLUE = '\u001b[34m';
const MAGENTA = '\u001b[35m';
const CYAN = '\u001b[36m';
const WHITE = '\u001b[37m';
const RESET = '\u001b[0m';

/**
 * @typedef {ReturnType<typeof getAllFromHost>} Listings
 */

/**
 * Creates a full text search CLI from the `data/hosts.json` file.
 */
{
  const ftsDB = new Database('data/fts.sqlite');

  createFullTextDatabase(ftsDB);
  console.log('fts.sqlite starts out as', getFileSize('data/fts.sqlite'));

  insertLocalCorpus(ftsDB);
  console.log('fts.sqlite grew to', getFileSize('data/fts.sqlite'));

  while (true) {
    const { text } = await inquirer.prompt([
      { type: 'input', name: 'text', message: 'Search' },
    ]);
    console.log('\n');
    search(ftsDB, text);
  }
}

/**
 * @param {import("better-sqlite3").Database} db
 */
function createFullTextDatabase(db) {
  if (getTableNames(db).includes('local_corpus')) {
    console.log('The virtual table already existed. Dropping it.');
    db.prepare(`DROP TABLE local_corpus`).run();
  }

  console.log('Creating the local_corpus full text search table.');
  db.prepare(
    sql`
      CREATE VIRTUAL TABLE local_corpus
      USING FTS5(title, description, content, url, tokenize="trigram")
    `,
  ).run();
}

/**
 * @param {import("better-sqlite3").Database} db
 */
function insertLocalCorpus(db) {
  const insert = db.prepare(
    sql`
      INSERT INTO local_corpus(title, description, content, url)
      VALUES (@title, @description, @content, @url)
    `,
  );

  let limit = 0;

  const insertRows = db.transaction(
    /**
     * @param {string} host
     * @param {Listings} rows
     */
    (host, rows) => {
      console.log('Inserting rows for', host);
      for (const row of rows) {
        if (limit++ >= 100) {
          break;
        }
        const hash = row.url_hash.toString(16);
        const { title, url, description } = row;
        const contentPath = `data/text/${hash}-${host}.txt`;
        if (!fs.existsSync(contentPath)) {
          continue;
        }
        const content = fs.readFileSync(contentPath, { encoding: 'utf8' });
        insert.run({ title, description, content, url });
      }
    },
  );

  /** @type {string[]} */
  const hosts = getJSON('data/hosts.json');
  for (const host of hosts) {
    if (!host.match(/^[\w.]+$/)) {
      throw new Error('Invalid host name');
    }
    /** @type {Listings} */
    const rows = getJSON(`data/list/${host}.json`);
    insertRows(host, rows);
  }
}

/**
 * @param {import("better-sqlite3").Database} db
 * @param {string} text
 */
function search(db, text) {
  /**
   * @typedef {Object} Row
   * @prop {string} title
   * @prop {string} description
   * @prop {string} content
   * @prop {string} url
   * @prop {string} rank
   * @prop {string} snippet
   */

  let now = performance.now();
  /** @type {Row[]} */
  const rows = db
    .prepare(
      sql`
        SELECT
          title,
          description,
          content,
          url,
          rank,
          snippet(
            local_corpus,
            2,    -- Zero-indexed column
            '${RED}',  -- Insert before text match
            '${RESET}',  -- Insert after text match
            '',   -- The text to add to the start or end of the selected text to indicate
                  -- that the returned text does not occur at the start or end of its
                  -- column, respectively.
            20    -- 0-64 The maximum number of tokens in the returned text.
          ) as snippet
        FROM local_corpus
        WHERE content MATCH @text
        ORDER BY rank
        LIMIT 5
      `,
    )
    .all({ text });

  const queryTime = performance.now() - now;
  now = performance.now();

  for (const { title, url, snippet, rank } of rows) {
    console.log(
      '\n\n┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────',
    );
    console.log(`${WHITE}│ ${title}${RESET}`);
    console.log(`│ ${CYAN}${url}${RESET}`);
    console.log(`│ ${YELLOW}Score: ${RESET}${rank}`);
    console.log(
      `├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────`,
    );
    console.log(
      snippet
        .split('\n')
        .map((s) => '│   ' + s)
        .join('\n'),
    );
    console.log(
      `└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────\n`,
    );
  }
  console.log('You searched for ', text);
  console.log(`Query took ${queryTime}ms`);
  console.log(`Formatting took ${performance.now() - now}ms`);
}
