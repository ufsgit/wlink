const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTriggers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const [rows] = await connection.execute('SHOW TRIGGERS');
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTriggers();
