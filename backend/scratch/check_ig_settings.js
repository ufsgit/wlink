const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBusinessSettings() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    console.log('\n--- Business Instagram/Facebook Settings ---');
    const [businesses] = await connection.execute('SELECT id, name, ig_account_id, fb_page_id, ig_token FROM businesses');
    console.table(businesses);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBusinessSettings();
