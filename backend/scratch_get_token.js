const pool = require('./src/db/pool');

async function getVerifyToken() {
  try {
    const [rows] = await pool.query('SELECT id, name, fb_verify_token FROM businesses LIMIT 1');
    if (rows.length > 0) {
      console.log(`Business Name: ${rows[0].name}`);
      console.log(`Verify Token: ${rows[0].fb_verify_token}`);
    } else {
      console.log('No businesses found in the database.');
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    process.exit(0);
  }
}

getVerifyToken();
