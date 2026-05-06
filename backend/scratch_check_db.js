const pool = require('./src/db/pool');
async function check() {
  const [rows] = await pool.query('SELECT id, fb_verify_token, LENGTH(fb_verify_token) as len FROM businesses');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
check();
