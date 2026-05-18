const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTodayMessages() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('--- Messages from Today (2026-05-13) ---');
    const [rows] = await connection.execute(`
      SELECT m.*, c.channel 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE m.sent_at >= '2026-05-13 00:00:00'
      ORDER BY m.sent_at DESC
    `);
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTodayMessages();
