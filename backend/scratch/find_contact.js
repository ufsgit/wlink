const pool = require('../src/db/pool');
async function find() {
  try {
    const [rows] = await pool.query("SELECT * FROM contacts WHERE name LIKE '%sa.1l._%' OR phone LIKE '%sa.1l._%'");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
find();
