const pool = require('../src/db/pool');

async function main() {
  try {
    const [rows] = await pool.query("SELECT id, name, category, status, body FROM templates WHERE business_id = 3");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
