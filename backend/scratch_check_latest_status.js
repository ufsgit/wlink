const pool = require('./src/db/pool');

async function checkConvo() {
  try {
    const [rows] = await pool.query('SELECT * FROM conversations WHERE id = 19');
    console.log('Convo 19 details:', rows);
    const [users] = await pool.query('SELECT * FROM users');
    console.log('Users:', users.map(u => ({ id: u.id, name: u.name, business_id: u.business_id, role: u.role })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

checkConvo();
