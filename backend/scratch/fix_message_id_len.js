const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixColumn() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('Checking column length...');
    const [rows] = await connection.execute('SHOW COLUMNS FROM messages WHERE Field = "wa_message_id"');
    console.table(rows);

    if (rows.length && rows[0].Type.includes('varchar(100)')) {
      console.log('Increasing column length to varchar(500)...');
      await connection.execute('ALTER TABLE messages MODIFY COLUMN wa_message_id VARCHAR(500)');
      console.log('✅ Success!');
    } else {
      console.log('Column is already large enough or not found.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixColumn();
