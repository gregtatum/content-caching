/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

import Database from 'better-sqlite3'; // https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import {
  getAllFromHost,
  getColumnsForTable,
  getIndexes,
  getTableNames,
  sql,
} from './utils.js';
const db = new Database('places.sqlite');

// console.log('Tables:', getTableNames(db));
// console.log('Indexes:', getIndexes(db));
// console.log(getColumnsForTable(db, 'moz_places'));

console.log(getAllFromHost(db, 'www.amazon.com', 100));
