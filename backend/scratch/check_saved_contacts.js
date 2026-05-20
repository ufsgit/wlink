const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'Wlink',
    });

    const [rows] = await connection.execute('SELECT id, name, phone, email, channel_preference FROM contacts ORDER BY id DESC LIMIT 5');
    console.log('--- Last 5 Contacts ---');
    console.table(rows);
  } catch (error) {
    console.error('Error querying contacts:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
