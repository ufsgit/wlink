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
    console.log('--- Conversations ---');
    const [convos] = await connection.query(`
      SELECT c.id, b.name as business, co.name as contact, co.phone, c.channel, c.status, c.last_message_at 
      FROM conversations c
      JOIN businesses b ON c.business_id = b.id
      JOIN contacts co ON c.contact_id = co.id
    `);
    console.table(convos);

    if (convos.length > 0) {
      console.log('\n--- Messages for latest conversation ---');
      const latestConvoId = convos[0].id;
      const [messages] = await connection.query(`
        SELECT direction, content, message_type, status, sent_at 
        FROM messages 
        WHERE conversation_id = ? 
        ORDER BY sent_at ASC
      `, [latestConvoId]);
      console.table(messages);
    } else {
      console.log('\nNo conversations found in the database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkData();
