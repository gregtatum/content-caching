/**
 * @typedef {import("better-sqlite3").Database} Database
 */

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
