const pool = require('./src/db/pool');
async function test() {
  const [rows] = await pool.query('SELECT * FROM contacts WHERE id = 104');
  console.log('Contacts 104:', rows);
  process.exit(0);
}
test();
