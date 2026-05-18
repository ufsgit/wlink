const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInbound() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('--- Recent Inbound Instagram Messages ---');
    const [rows] = await connection.execute(`
      SELECT m.*, c.channel 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      WHERE m.direction = 'inbound' AND c.channel = 'instagram'
      ORDER BY m.sent_at DESC LIMIT 5
    `);
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInbound();
