const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('--- Messages with WhatsApp ID ---');
    const [messages] = await connection.query(`
      SELECT m.*, c.channel 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.wa_message_id IS NOT NULL OR c.channel = 'whatsapp'
    `);
    console.table(messages);

    if (messages.length === 0) {
        console.log('No WhatsApp messages found in the database.');
        
        console.log('\n--- Checking Broadcast Logs (might contain messages) ---');
        const [logs] = await connection.query(`
          SELECT l.*, b.name as broadcast_name, co.name as contact_name
          FROM broadcast_logs l
          JOIN broadcasts b ON l.broadcast_id = b.id
          JOIN contacts co ON l.contact_id = co.id
        `);
        console.table(logs);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkData();
