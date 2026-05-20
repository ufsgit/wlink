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

    console.log('Connected to the database. Running ALTER TABLE query...');
    await connection.execute(`
      ALTER TABLE contacts 
      MODIFY COLUMN channel_preference ENUM('whatsapp','sms','rcs','instagram','facebook','website') DEFAULT 'whatsapp'
    `);
    console.log('✅ ALTER TABLE completed successfully!');
  } catch (error) {
    console.error('❌ Error executing ALTER TABLE query:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
