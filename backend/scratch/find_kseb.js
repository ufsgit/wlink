const pool = require('../src/db/pool');

async function main() {
  try {
    const [rows] = await pool.query("SELECT * FROM templates WHERE body LIKE '%KSEB%'");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
