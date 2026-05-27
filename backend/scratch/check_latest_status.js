const pool = require('../src/db/pool');
pool.query('SELECT status FROM messages ORDER BY id DESC LIMIT 1')
  .then(([rows]) => { console.log(rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
