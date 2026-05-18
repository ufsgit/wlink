const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await connection.execute(
    "SELECT id, assigned_to FROM conversations WHERE channel='instagram'"
  );
  
  console.table(rows);
  await connection.end();
}

check().catch(console.error);
