const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLatestBroadcast() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wlink',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('--- 1. Latest Broadcast Attempt ---');
    const [broadcasts] = await connection.query(`
      SELECT b.id, b.name, b.status, b.total_recipients, b.total_sent, b.total_failed, b.created_at, b.template_id, t.name as template_name, t.language as template_language
      FROM broadcasts b
      JOIN templates t ON b.template_id = t.id
      ORDER BY b.created_at DESC
      LIMIT 1
    `);
    console.table(broadcasts);

    if (broadcasts.length > 0) {
      const bid = broadcasts[0].id;
      console.log(`\n--- 2. Broadcast Logs for Broadcast ID: ${bid} ---`);
      const [logs] = await connection.query(`
        SELECT bl.*, c.name as contact_name, c.phone as contact_phone
        FROM broadcast_logs bl
        JOIN contacts c ON bl.contact_id = c.id
        WHERE bl.broadcast_id = ?
      `, [bid]);
      console.table(logs);
      
      console.log(`\n--- 3. Database Messages for Latest Broadcast's Contact ---`);
      if (logs.length > 0) {
        const contactId = logs[0].contact_id;
        const [msgs] = await connection.query(`
          SELECT id, conversation_id, direction, content, message_type, status, sent_at, wa_message_id
          FROM messages
          WHERE conversation_id IN (
            SELECT id FROM conversations WHERE contact_id = ?
          )
          ORDER BY sent_at DESC
          LIMIT 5
        `, [contactId]);
        console.table(msgs);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkLatestBroadcast();
