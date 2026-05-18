const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function findLinkedPage() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const [rows] = await connection.execute('SELECT ig_token, ig_account_id FROM businesses WHERE id = 1');
    const { ig_token, ig_account_id } = rows[0];

    if (!ig_token || !ig_account_id) {
      console.log('Missing token or account ID');
      return;
    }

    console.log('Checking Instagram Account:', ig_account_id);

    // Try to get the Facebook Page linked to this Instagram account
    // Endpoint: GET /v18.0/{ig-account-id}?fields=connected_facebook_page
    try {
      const res = await axios.get(`https://graph.facebook.com/v18.0/${ig_account_id}`, {
        params: {
          fields: 'connected_facebook_page',
          access_token: ig_token
        }
      });
      console.log('Result for connected_facebook_page:', JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error('Error fetching connected_facebook_page:', err.response?.data || err.message);
    }

    // Alternatively, list all pages managed by the user to find which one is linked
    try {
      const res = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
        params: {
          fields: 'id,name,instagram_business_account',
          access_token: ig_token
        }
      });
      console.log('User Pages:', JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error('Error fetching me/accounts:', err.response?.data || err.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

findLinkedPage();
