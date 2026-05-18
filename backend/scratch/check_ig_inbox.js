/**
 * Shows ALL contacts and Instagram conversations in DB
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log('\n=== ALL CONTACTS (most recent first) ===');
    const [contacts] = await conn.query(
      'SELECT id, name, phone, channel_preference, created_at FROM contacts ORDER BY created_at DESC LIMIT 20'
    );
    console.table(contacts);

    console.log('\n=== ALL INSTAGRAM CONVERSATIONS ===');
    const [convos] = await conn.query(
      `SELECT c.id, co.name, co.phone as igsid, c.status, c.last_message_at
       FROM conversations c
       JOIN contacts co ON c.contact_id = co.id
       WHERE c.channel = 'instagram'
       ORDER BY c.last_message_at DESC`
    );
    console.table(convos);

    if (convos.length > 0) {
      console.log('\n=== MESSAGES in latest Instagram conversation ===');
      const [msgs] = await conn.query(
        'SELECT direction, content, sent_at FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC',
        [convos[0].id]
      );
      console.table(msgs);
    }
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
