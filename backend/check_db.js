const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('--- Users ---');
    const [users] = await connection.execute('SELECT id, email, is_active, business_id FROM users');
    console.table(users);

    console.log('\n--- Businesses ---');
    const [businesses] = await connection.execute('SELECT id, name FROM businesses');
    console.table(businesses);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
