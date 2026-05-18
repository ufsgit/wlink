const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // Delete messages with NULL wa_message_id that are duplicates 
  // (old messages saved before we tracked mid - likely test/spam)
  const [nullMids] = await connection.execute(`
    DELETE FROM messages 
    WHERE conversation_id = 11 
    AND wa_message_id IS NULL 
    AND content IN ('Hi', 'Hio', 'random_text', 'Hello! 👋 Reaching out from WLink.')
  `);
  console.log(`Removed ${nullMids.affectedRows} old test messages with NULL mid`);

  // Delete duplicate content messages that were created within seconds of each other
  const [timeDupes] = await connection.execute(`
    DELETE m1 FROM messages m1
    INNER JOIN messages m2 
    ON m1.conversation_id = m2.conversation_id 
    AND m1.content = m2.content 
    AND m1.direction = m2.direction
    AND m1.id > m2.id
    AND TIMESTAMPDIFF(SECOND, m2.sent_at, m1.sent_at) < 30
    WHERE m1.conversation_id = 11
  `);
  console.log(`Removed ${timeDupes.affectedRows} near-duplicate messages`);

  // Show final count
  const [counts] = await connection.execute(
    "SELECT conversation_id, COUNT(*) as msg_count FROM messages WHERE conversation_id = 11"
  );
  console.log('\nFinal message count:');
  console.table(counts);

  // Show remaining messages
  const [msgs] = await connection.execute(
    "SELECT id, direction, content, sent_at FROM messages WHERE conversation_id = 11 ORDER BY sent_at ASC"
  );
  console.log('\nAll remaining messages:');
  console.table(msgs);

  await connection.end();
}

cleanup().catch(console.error);
