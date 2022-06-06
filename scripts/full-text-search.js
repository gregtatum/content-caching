/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

// Docs: https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import Database from 'better-sqlite3';
import * as fs from 'fs';
import {
  getAllFromHost,
  getColumnsForTable,
  getFileSize,
  getIndexes,
  getJSON,
  getTableNames,
  sql,
} from './utils.js';

try {
  const placesDB = new Database('places.sqlite');
  const ftsDB = new Database('fts.sqlite');

  if (getTableNames(ftsDB).includes('local_corpus')) {
    console.log('The virtual table already existed. Dropping it.');
    await ftsDB.prepare(`DROP TABLE local_corpus`).run();
  }

  console.log('Creating the local_corpus full text search table.');
  ftsDB
    .prepare(
      sql`
          CREATE VIRTUAL TABLE local_corpus
          USING FTS5(title, description, content, url)
        `,
    )
    .run();
  console.log('fts.sqlite starts out as', getFileSize('fts.sqlite'));

  getLocalCorpus(ftsDB);
  console.log('fts.sqlite grew to', getFileSize('fts.sqlite'));
} catch (error) {
  console.error(error);
}

/**
 * @typedef {ReturnType<typeof getAllFromHost>} Listings
 */

/**
 * @param {import("better-sqlite3").Database} db
 */
function getLocalCorpus(db) {
  const insert = db.prepare(
    sql`
      INSERT INTO local_corpus(title, description, content, url)
      VALUES (@title, @description, @content, @url)
    `,
  );

  const insertRows = db.transaction(
    /**
     * @param {string} host
     * @param {Listings} rows
     */
    (host, rows) => {
      console.log('Inserting rows for', host);
      for (const row of rows) {
        const hash = row.url_hash.toString(16);
        const { title, url, description } = row;
        const contentPath = `data/text/${hash}-${host}.txt`;
        if (!fs.existsSync(contentPath)) {
          continue;
        }
        const content = fs.readFileSync(contentPath);
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
