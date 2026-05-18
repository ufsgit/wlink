const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [result] = await connection.execute(
    "UPDATE conversations SET status='open' WHERE channel='instagram' AND (status IS NULL OR status='')"
  );
  
  console.log(`✅ Fixed ${result.affectedRows} Instagram conversations.`);
  await connection.end();
}

fix().catch(console.error);
