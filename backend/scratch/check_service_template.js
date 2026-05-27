const pool = require('../src/db/pool');
pool.query('SELECT header_type, body, footer, buttons FROM templates WHERE name="service"').then(([rows]) => { console.log(rows); process.exit(0); });
