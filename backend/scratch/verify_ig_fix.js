const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInstagramMessage() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const [rows] = await connection.execute('SELECT ig_token, fb_page_id FROM businesses WHERE id = 1');
    const { ig_token, fb_page_id } = rows[0];

    console.log('Using Page ID:', fb_page_id);

    if (!ig_token || !fb_page_id) {
      console.error('Missing credentials in DB');
      return;
    }

    // Find a valid recipient from contacts linked to an Instagram conversation
    const [contacts] = await connection.execute(`
      SELECT c.platform_id 
      FROM contacts c
      JOIN conversations conv ON c.id = conv.contact_id
      WHERE conv.channel = 'instagram'
      ORDER BY conv.last_message_at DESC
      LIMIT 1
    `);
    
    let recipientId = '789123456'; 
    if (contacts.length && contacts[0].platform_id) {
      recipientId = contacts[0].platform_id;
      console.log('Using recent Instagram recipient:', recipientId);
    } else {
      console.log('No recent Instagram contacts found, using placeholder');
    }

    try {
      const res = await axios.post(`https://graph.facebook.com/v18.0/${fb_page_id}/messages`, {
        recipient: { id: recipientId },
        message: { text: 'Test message from UrbanChat after fixing Page ID' },
        messaging_type: 'RESPONSE'
      }, {
        headers: {
          'Authorization': `Bearer ${ig_token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', res.data);
    } catch (err) {
      console.error('❌ Error:', JSON.stringify(err.response?.data || err.message, null, 2));
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testInstagramMessage();
