const pool = require('../src/db/pool');

async function insertTemplate() {
  const businessId = 4;
  const [rows] = await pool.query('SELECT * FROM templates WHERE name="service" AND business_id=?', [businessId]);
  if (rows.length === 0) {
    await pool.query(
      `INSERT INTO templates (business_id, name, category, language, header_type, body, footer, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, 'service', 'MARKETING', 'en', 'none', 'Techtify - Fast & Reliable Services', '', 'approved']
    );
    console.log('Inserted service template into database.');
  } else {
    console.log('Template already exists in DB.');
  }
  process.exit(0);
}

insertTemplate().catch(err => {
  console.error(err);
  process.exit(1);
});
