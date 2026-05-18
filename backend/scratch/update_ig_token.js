/**
 * Run this script to update the Instagram token in the database.
 * Usage:  node scratch/update_ig_token.js YOUR_NEW_TOKEN_HERE
 *
 * Example:
 *   node scratch/update_ig_token.js EAABwz...longtoken...
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const newToken = process.argv[2];

if (!newToken) {
  console.error('❌ Please provide the new token as an argument.');
  console.error('   Usage: node scratch/update_ig_token.js YOUR_TOKEN_HERE');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  await conn.query('UPDATE businesses SET ig_token = ? WHERE id = 1', [newToken]);
  console.log('✅ Instagram token updated successfully for business ID 1!');
  console.log('   Token starts with:', newToken.slice(0, 25) + '...');
  console.log('\n   Now run:  node scratch/resolve_and_send_ig.js');

  await conn.end();
}

main().catch(console.error);
