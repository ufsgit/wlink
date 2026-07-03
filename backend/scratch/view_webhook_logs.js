const pool = require('./src/db/pool');

async function getLogs() {
  const [rows] = await pool.query('SELECT * FROM temp_webhook_logs ORDER BY id DESC LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
getLogs();
