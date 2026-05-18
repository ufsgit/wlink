const pool = require('../src/db/pool');
require('dotenv').config();

async function findInstagramContact() {
  try {
    const [rows] = await pool.query("SELECT co.* FROM contacts co JOIN conversations c ON co.id = c.contact_id WHERE c.channel = 'instagram'");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

findInstagramContact();
