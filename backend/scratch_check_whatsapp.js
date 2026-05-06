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
    console.log('--- Linked Businesses (WhatsApp) ---');
    const [businesses] = await connection.query(`
      SELECT id, name, whatsapp_number, whatsapp_phone_id, whatsapp_token IS NOT NULL as token_exists
      FROM businesses 
      WHERE whatsapp_phone_id IS NOT NULL OR whatsapp_number IS NOT NULL
    `);
    console.table(businesses);

    console.log('\n--- WhatsApp Conversations ---');
    const [convos] = await connection.query(`
      SELECT c.id, co.name as contact, co.phone, c.status, c.last_message_at 
      FROM conversations c
      JOIN contacts co ON c.contact_id = co.id
      WHERE c.channel = 'whatsapp'
    `);
    console.table(convos);

    if (convos.length > 0) {
      for (const convo of convos) {
          console.log(`\n--- Messages for conversation ID: ${convo.id} (Contact: ${convo.contact}) ---`);
          const [messages] = await connection.query(`
            SELECT direction, content, message_type, status, sent_at 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY sent_at ASC
          `, [convo.id]);
          console.table(messages);
      }
    } else {
      console.log('\nNo WhatsApp conversations found in the database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkData();
