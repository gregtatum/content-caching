/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

import Database from 'better-sqlite3'; // https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import fs from 'fs';

import { sql } from './utils.js';

const denyList = new Set([
  'auth.mozilla.auth0.com',
  'people.mozilla.org',
  'calendar.google.com',
  'localhost',
  'accounts.google.com',
  'chords.gregtatum.com',
  'console.aws.amazon.com',
  'dashboard.heroku.com',
  'mail.google.com',
  'profiler.firefox.com',
  'translate.google.com',
  'treeherder.mozilla.org',
  'us-east-1.console.aws.amazon.com',
  'www.dropbox.com',
  'www.linkedin.com',
  'analytics.google.com',
  'app.tripactions.com',
]);

const prefixMatch = ['https://www.google.com/maps'];

/**
 * Builds a list of the most recent urls from the the `data/places.sqlite` file.
 * You can copy yours from the Firefox profile directory. This folder location can
 * be found in about:support.
 *
 * The file generated is `data/list/most-recent-urls.json`
 */
{
  const db = new Database('data/places.sqlite');
  const rows = db
    .prepare(
      sql`
          SELECT   url, title, description, url_hash
          FROM     moz_places
          ORDER BY last_visit_date DESC
          LIMIT    13678 -- 10,000 filtered results
        `,
    )
    .all();

  const targetPath = `data/list/most-recent-urls.json`;

  const filteredResults = [];
  for (const row of rows) {
    try {
      const url = new URL(row.url);
      if (denyList.has(url.hostname)) {
        continue;
      }
    } catch (_) {}
    for (const prefix of prefixMatch) {
      if (row.url.startsWith(prefix)) {
        continue;
      }
    }
    filteredResults.push(row);
  }

  console.log(`Writing out (${filteredResults.length})`, targetPath);
  fs.writeFileSync(
    `data/list/most-recent-urls.json`,
    JSON.stringify(filteredResults, null, 2),
  );

  fs.writeFileSync(
    `data/list/most-recent-urls.txt`,
    filteredResults
      .map((row) => row.url)
      .sort((a, b) => a.localeCompare(b))
      .join('\n'),
  );
}
