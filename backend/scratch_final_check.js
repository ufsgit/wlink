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
    const [businesses] = await connection.query('SELECT id, name, whatsapp_number, whatsapp_phone_id FROM businesses');
    console.log('--- Linked WhatsApp Accounts ---');
    console.table(businesses);

    const [convos] = await connection.query('SELECT * FROM conversations WHERE channel = "whatsapp"');
    console.log('\n--- WhatsApp Conversations ---');
    console.table(convos);

    const [messages] = await connection.query('SELECT * FROM messages WHERE wa_message_id IS NOT NULL');
    console.log('\n--- WhatsApp Messages ---');
    console.table(messages);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkData();
