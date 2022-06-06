import * as fs from 'fs';

/**
 * @typedef {import("better-sqlite3").Database} Database
 * @typedef {import("./types").MozPlacesRow} MozPlacesRow
 */

/**
 * The host is stored in reverse order for faster searching of subdomains.
 * @param {string} host
 * @returns {string}
 */
export function getRevesedHost(host) {
  return host.split('').reverse().join('') + '.';
}

/**
 * @param {TemplateStringsArray} strings
 * @param {any[]} injections
 * @returns {string}
 */
export function sql(strings, ...injections) {
  let text = '';

  for (let i = 0; i < strings.length; i++) {
    const string = strings[i];
    text += string;

    const injection = injections[i];
    if (injection !== undefined) {
      text += injection;
    }
  }

  return text;
}

/**
 * @param {Database} db
 * @return {string[]}
 */
export function getTableNames(db) {
  const rows = db
    .prepare(
      sql`
      SELECT name FROM sqlite_master WHERE type='table';
    `,
    )
    .all();

  if (!rows) {
    return [];
  }

  return rows.map((row) => row.name);
}

/**
 * @param {Database} db
 * @return {string[]}
 */
export function getIndexes(db) {
  const rows = db
    .prepare(
      sql`
      SELECT name FROM sqlite_master WHERE type='index';
    `,
    )
    .all();

  if (!rows) {
    return [];
  }

  return rows.map((row) => row.name);
}

/**
 * @param {Database} db
 * @param {string} table
 */
export function getColumnsForTable(db, table) {
  // Be restrictive on this injection issue:
  if (!table.match(/[a-z_]/i)) {
    throw new Error('Unexpected table values.');
  }

  // SQL Injection attack vector:
  return db.pragma(`table_info(${table})`);
}

/**
 * @param {Database} db
 * @param {string} host
 * @param {number} limit
 *
 * @return {Pick<MozPlacesRow, "url" | "title" | "description" | "url_hash">[]}
 */
export function getAllFromHost(db, host, limit) {
  const rows = db
    .prepare(
      sql`
        SELECT   url, title, description, url_hash
        FROM     moz_places
        WHERE    rev_host = ?
        ORDER BY last_visit_date DESC
        LIMIT    ?
      `,
    )
    .all(getRevesedHost(host), limit);
  if (!rows) {
    return [];
  }
  return rows;
}

/**
 * @param {number} n
 * @returns {number}
 */
function prettyNumber(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {string} path
 * @returns {string}
 */
export function getFileSize(path) {
  const bytes = fs.statSync(path).size;
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    return `${prettyNumber(bytes / 1024)}kb`;
  }
  return `${prettyNumber(bytes / 1024 / 1024)}mb`;
}

/**
 * @param {string} path
 * @returns {any}
 */
export function getJSON(path) {
  return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
}
