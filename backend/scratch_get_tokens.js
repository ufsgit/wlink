const pool = require('./src/db/pool');
async function getTokens() {
  try {
    const [rows] = await pool.query('SELECT id, name, fb_verify_token FROM businesses');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
getTokens();
