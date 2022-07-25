/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check

// Docs: https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
import Database from 'better-sqlite3';
import { sql } from './utils.js';

/**
 * This is me figuring out the over clause.
 */
{
  const db = new Database('data/places.sqlite');

  db.function('nice_host', (revHost) => {
    if (!revHost) {
      return revHost;
    }
    let host = '';
    for (let i = revHost.length - 2; i >= 0; i--) {
      host += revHost[i];
    }
    return host;
  });

  const rows = db
    .prepare(
      sql`
        SELECT
          id,
          url,
          title,
          nice_host(rev_host) as host,
          visit_count,
          -- hidden,
          -- typed,
          -- favicon_id,
          -- frecency,
          -- last_visit_date,
          -- guid,
          -- foreign_count,
          -- url_hash,
          -- description,
          -- preview_image_url,
          -- origin_id,
          site_name,
          COUNT(rev_host) OVER (PARTITION BY rev_host) as count_by_host
        FROM moz_places
        ORDER BY count_by_host
        LIMIT 1000
    `,
    )
    .all();
  console.log(`!!! rows`, rows);
}
