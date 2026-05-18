const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugMessage() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const convId = 11;
    const [convRows] = await connection.execute(
      'SELECT c.*, co.phone FROM conversations c JOIN contacts co ON c.contact_id = co.id WHERE c.id = ?',
      [convId]
    );
    const conv = convRows[0];
    console.log('Conversation:', conv);

    const [bizRows] = await connection.execute('SELECT ig_token, fb_page_id FROM businesses WHERE id = ?', [conv.business_id]);
    const { ig_token, fb_page_id } = bizRows[0];

    console.log('Credentials:', { ig_token: ig_token?.substring(0, 10) + '...', fb_page_id });

    try {
      const res = await axios.post(`https://graph.facebook.com/v18.0/${fb_page_id}/messages`, {
        recipient: { id: conv.phone },
        message: { text: 'Debug message' },
        messaging_type: 'RESPONSE'
      }, {
        headers: {
          'Authorization': `Bearer ${ig_token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', res.data);
    } catch (err) {
      console.error('❌ Error details:', JSON.stringify(err.response?.data || err.message, null, 2));
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugMessage();
