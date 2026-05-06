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
    console.log('--- All Messages (Last 10) ---');
    const [messages] = await connection.query(`
      SELECT m.*, c.channel 
      FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      ORDER BY m.id DESC
      LIMIT 10
    `);
    console.table(messages);

    console.log('\n--- Contacts with WhatsApp source ---');
    const [contacts] = await connection.query(`
      SELECT id, name, phone, opt_in_source 
      FROM contacts 
      WHERE opt_in_source = 'whatsapp' OR phone LIKE '+%'
    `);
    console.table(contacts);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkData();
