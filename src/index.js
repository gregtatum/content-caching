// @ts-check
import sqlite3 from 'sqlite3';
import { sql } from './utils.js';

sqlite3.verbose();

const db = new sqlite3.Database('./test.sqlite');

db.serialize(() => {
  db.each(
    sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name='lorem';
    `,
    (err, row) => {
      console.log(row);
    },
  );
  console.log('Done');
  return;

  db.run('CREATE TABLE lorem (info TEXT)');

  const stmt = db.prepare('INSERT INTO lorem VALUES (?)');
  for (let i = 0; i < 10; i++) {
    stmt.run('Ipsum ' + i);
  }
  stmt.finalize();

  db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
    console.log(row.id + ': ' + row.info);
  });
});

db.close();
