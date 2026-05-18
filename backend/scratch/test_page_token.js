const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function getPageToken() {
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

    console.log('Fetching accounts for user token...');
    const res = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
      params: {
        access_token: ig_token,
        fields: 'id,name,access_token,instagram_business_account'
      }
    });

    const pages = res.data.data;
    console.log('Found Pages:', pages.length);

    const targetPage = pages.find(p => p.id === fb_page_id);
    if (targetPage) {
      console.log('✅ Found Page Access Token for:', targetPage.name);
      console.log('Page Token:', targetPage.access_token.substring(0, 15) + '...');
      
      // Update the DB with the Page Access Token if it's different?
      // Actually, let's just test it first.
      
      try {
        const sendRes = await axios.post(`https://graph.facebook.com/v18.0/${fb_page_id}/messages`, {
          recipient: { id: '1425669199332304' }, // Recipient from conv 11
          message: { text: 'Test message using Page Access Token' }
        }, {
          headers: { 'Authorization': `Bearer ${targetPage.access_token}` }
        });
        console.log('🚀 Send Success with Page Token:', sendRes.data);
      } catch (err) {
        console.error('❌ Send Error with Page Token:', JSON.stringify(err.response?.data || err.message, null, 2));
      }

    } else {
      console.log('❌ Could not find target page in accounts list');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

getPageToken();
