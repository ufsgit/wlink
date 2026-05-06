const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateInbox() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const bizId = 1;
  const phone = '919895095713';
  const name = 'My Authorized Phone';

  try {
    // 1. Ensure contact exists
    const [cRows] = await connection.query('SELECT id FROM contacts WHERE phone = ? AND business_id = ?', [phone, bizId]);
    let contactId;
    if (cRows.length === 0) {
      const [result] = await connection.query(
        'INSERT INTO contacts (business_id, name, phone, opted_in, opt_in_source) VALUES (?, ?, ?, 1, "whatsapp")',
        [bizId, name, phone]
      );
      contactId = result.insertId;
    } else {
      contactId = cRows[0].id;
    }

    // 2. Create conversation
    const [convResult] = await connection.query(
      'INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, "whatsapp", NOW())',
      [bizId, contactId]
    );
    const convId = convResult.insertId;

    // 3. Record the message we just sent
    await connection.query(
      'INSERT INTO messages (conversation_id, direction, content, message_type, status) VALUES (?, "outbound", ?, "text", "sent")',
      [convId, 'Hello! This is a REAL message sent from your UrbanChat software system. 🚀']
    );

    console.log('✅ Success! Your Inbox has been updated.');
    console.log('Conversation ID:', convId);
    console.log('\nRefresh your browser and you will see "My Authorized Phone" in your Inbox.');

  } catch (err) {
    console.error('Error updating database:', err.message);
  } finally {
    await connection.end();
  }
}

updateInbox();
