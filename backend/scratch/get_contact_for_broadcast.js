const pool = require('../src/db/pool');

async function testBroadcast() {
  const [contacts] = await pool.query('SELECT id, name, phone, business_id FROM contacts WHERE name LIKE "%salman%"');
  console.log('Contacts:', contacts);

  const [templates] = await pool.query('SELECT id, name, status, business_id FROM templates WHERE status="approved"');
  console.log('Templates:', templates);

  process.exit(0);
}

testBroadcast().catch(err => {
  console.error(err);
  process.exit(1);
});
