import { getJSON } from './utils.js';
import * as fs from 'fs';

/**
 * @typedef {ReturnType<import("./utils.js").getAllFromHost>} Listings
 */

/**
 * This script builds an Algolia search index from the data/hosts.json file.
 */
{
  const results = [];
  const hosts = getJSON('data/hosts.json');
  for (const host of hosts) {
    if (!host.match(/^[\w.]+$/)) {
      throw new Error('Invalid host name');
    }
    /** @type {Listings} */
    const rows = getJSON(`data/list/${host}.json`);
    for (const row of rows) {
      const hash = row.url_hash.toString(16);
      const { title, url, description } = row;
      const contentPath = `data/text/${hash}-${host}.txt`;
      if (!fs.existsSync(contentPath)) {
        continue;
      }
      const content = fs.readFileSync(contentPath, { encoding: 'utf8' });
      results.push({ title, description, content, url, host, hash });
    }
  }
  fs.writeFileSync('data/algolia.json', JSON.stringify(results, null, 2));
}
