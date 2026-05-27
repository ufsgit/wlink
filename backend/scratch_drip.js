const pool = require('./src/db/pool');

async function checkDB() {
  try {
    const [campaigns] = await pool.query("SELECT id, name, is_active, steps FROM drip_campaigns");
    console.log("=== DRIP CAMPAIGNS ===");
    console.log(JSON.stringify(campaigns, null, 2));

    const [enrollments] = await pool.query("SELECT * FROM drip_enrollments");
    console.log("\n=== ENROLLMENTS ===");
    console.log(JSON.stringify(enrollments, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkDB();
