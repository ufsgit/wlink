const pool = require('../src/db/pool');

async function main() {
  try {
    const [rows] = await pool.query("SELECT id, name, category, body FROM templates WHERE name LIKE '% %' OR LENGTH(name) > 50");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
