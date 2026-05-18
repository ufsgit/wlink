const axios = require('axios');
require('dotenv').config();

async function checkToken() {
  const token = 'EAASQM6HaNxIBOz9I4fX1fT019mE0uZC4T7v9A0YJ76p7vZAoZCvL0Iun99U9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9v99ZC9'; // I'll get it from DB in the script
  
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'urbanchat',
  });

  const [rows] = await connection.execute('SELECT ig_token FROM businesses WHERE id = 1');
  const ig_token = rows[0].ig_token;

  try {
    const res = await axios.get(`https://graph.facebook.com/debug_token`, {
      params: {
        input_token: ig_token,
        access_token: ig_token // Using the token itself to debug (or should use App Token)
      }
    });
    console.log('Token Debug:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Token Debug Error:', err.response?.data || err.message);
  }
  
  // Also try to get token info via /me
  try {
    const res = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      params: {
        access_token: ig_token
      }
    });
    console.log('Me info:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Me info Error:', err.response?.data || err.message);
  }

  await connection.end();
}

checkToken();
