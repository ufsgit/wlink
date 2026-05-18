const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Count messages per conversation
  const [counts] = await connection.execute(
    "SELECT conversation_id, COUNT(*) as msg_count FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE channel='instagram') GROUP BY conversation_id"
  );
  console.log('Message counts per conversation:');
  console.table(counts);

  // Show last 20 messages in conversation 11
  const [msgs] = await connection.execute(
    "SELECT id, direction, content, sent_at FROM messages WHERE conversation_id = 11 ORDER BY id DESC LIMIT 20"
  );
  console.log('\nLast 20 messages in conversation 11:');
  console.table(msgs);

  await connection.end();
}

check().catch(console.error);
