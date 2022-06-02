/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

import Database from 'better-sqlite3'; // https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

import {
  getAllFromHost,
  getColumnsForTable,
  getIndexes,
  getTableNames,
  sql,
} from './utils.js';

{
  /** @type {string[]} */
  const hosts = JSON.parse(
    fs.readFileSync('data/hosts.json', { encoding: 'utf8' }),
  );

  for (const host of hosts) {
    if (!host.match(/^[a-z.-]*$/i)) {
      throw new Error('A host value has illegal characters: ' + host);
    }

    const db = new Database('places.sqlite');
    const rows = getAllFromHost(db, host, 500);
    const targetPath = `data/list/${host}.json`;
    console.log('Writing out', targetPath);
    fs.writeFileSync(`data/list/${host}.json`, JSON.stringify(rows, null, 2));
  }
}
