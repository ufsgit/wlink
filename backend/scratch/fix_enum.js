require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/db/pool');

async function fix() {
  try {
    await pool.query(
      "ALTER TABLE messages MODIFY COLUMN message_type ENUM('text','image','video','document','template','interactive','location','audio')"
    );
    console.log('✅ message_type ENUM updated — "audio" added successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit(0);
}

fix();
