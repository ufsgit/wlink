const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkConversations() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('--- Instagram Conversations ---');
    const [rows] = await connection.execute('SELECT * FROM conversations WHERE platform = "instagram" ORDER BY last_message_at DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkConversations();
