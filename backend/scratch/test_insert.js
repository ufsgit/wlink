const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsert() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('Testing direct INSERT into messages...');
    try {
      const [result] = await connection.execute(
        "INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, ?, ?, 'text')", 
        [11, 'outbound', 'Direct test message from script']
      );
      console.log('✅ Success! Insert ID:', result.insertId);
    } catch (err) {
      console.error('❌ INSERT FAILED:', err.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Connection Error:', error);
  }
}

testInsert();
