const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const email = 'salmansajeer7@gmail.com';
    const plainTextPassword = 'password123';
    
    const hash = await bcrypt.hash(plainTextPassword, 10);
    
    await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    
    console.log(`Password for ${email} reset to: ${plainTextPassword}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();
