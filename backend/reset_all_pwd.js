const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetAllPasswords() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'urbanchat',
    });

    const plainTextPassword = 'password123';
    const hash = await bcrypt.hash(plainTextPassword, 10);
    
    const [result] = await connection.execute('UPDATE users SET password_hash = ?', [hash]);
    
    console.log(`Reset ${result.affectedRows} user(s) passwords to: ${plainTextPassword}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAllPasswords();
