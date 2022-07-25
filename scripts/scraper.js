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

/**
 * A node.js based scraper.
 *
 * Warning! This doesn't work well as most site detect scrapers and have
 * anti-bot protections.
 */
{
  const db = new Database('data/places.sqlite');

  // eslint-disable-next-line no-constant-condition
  if (false) {
    console.log('Tables:', getTableNames(db));
    console.log('Indexes:', getIndexes(db));
    console.log(getColumnsForTable(db, 'moz_places'));
  }

  const rows = getAllFromHost(db, 'www.amazon.com', 100);
  console.log('Scraping:', rows[0].url);
  console.log('------------------------------------------------------');

  for (const { url, url_hash } of rows) {
    const hash = url_hash.toString(16);
    const html = await scrapeURLIfNeeded(url, hash);
    if (html === null) {
      console.log('Cached:', hash, url);
    } else {
      console.log('Scraped:', hash, url);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Scrapes the URL if no cache exists.
 *
 * @param {string} url
 * @param {string} hash
 * @returns {Promise<string | null>}
 */
async function scrapeURLIfNeeded(url, hash) {
  const filePath = path.join('data/html', hash + '.html');

  if (fs.existsSync(filePath)) {
    return null;
  }

  const result = await fetch(url, {
    headers: { 'User-Agent': 'Research Robot' },
  });
  const html = await result.text();
  fs.writeFileSync(filePath, html);

  return html;
}

/**
 * @param {string} url
 * @param {string} hash
 * @returns {Promise<string | null>}
 */
async function getFullText(url, hash) {
  const filePath = path.join('data/html', hash + '.html');
  const html = await scrapeURLIfNeeded(url, hash);
  if (html) {
    return html;
  }
  return fs.readFileSync(filePath, { encoding: 'utf8' });
}

/**
 * @param {string} html
 * @returns {string}
 */
function extractText(html) {
  const $ = cheerio.load(html);
  $('script, head, style, noscript').remove();

  return $.text()
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s)
    .join('\n');
}
