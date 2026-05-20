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
      ALTER TABLE broadcasts 
      ADD COLUMN channel VARCHAR(50) DEFAULT 'whatsapp' AFTER name
    `);
    console.log('✅ ALTER TABLE broadcasts completed successfully!');
  } catch (error) {
    console.error('❌ Error executing ALTER TABLE query:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
