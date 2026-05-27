const pool = require('../src/db/pool');

async function dedupe() {
  try {
    console.log('Finding duplicates...');
    const [duplicates] = await pool.query(`
      SELECT business_id, phone, COUNT(*) as cnt, MIN(id) as primary_id
      FROM contacts
      WHERE phone IS NOT NULL AND phone != ''
      GROUP BY business_id, phone
      HAVING cnt > 1
    `);

    console.log(`Found ${duplicates.length} duplicate groups.`);

    for (const dup of duplicates) {
      const bizId = dup.business_id;
      const phone = dup.phone;
      const primaryId = dup.primary_id;

      // Get all ids for this group
      const [rows] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, phone]);
      const duplicateIds = rows.map(r => r.id).filter(id => id !== primaryId);

      if (duplicateIds.length === 0) continue;

      console.log(`Merging ${duplicateIds.length} duplicates into primary contact ${primaryId} for phone ${phone}`);

      // Update foreign keys (using ignore to avoid duplicate key errors in cases where unique constraints exist, although mostly they don't on contact_id)
      await pool.query(`UPDATE IGNORE conversations SET contact_id=? WHERE contact_id IN (?)`, [primaryId, duplicateIds]);
      await pool.query(`UPDATE IGNORE broadcast_logs SET contact_id=? WHERE contact_id IN (?)`, [primaryId, duplicateIds]);
      await pool.query(`UPDATE IGNORE chatbot_sessions SET contact_id=? WHERE contact_id IN (?)`, [primaryId, duplicateIds]);
      await pool.query(`UPDATE IGNORE drip_enrollments SET contact_id=? WHERE contact_id IN (?)`, [primaryId, duplicateIds]);
      await pool.query(`UPDATE IGNORE orders SET contact_id=? WHERE contact_id IN (?)`, [primaryId, duplicateIds]);

      // Delete the duplicate contacts
      await pool.query(`DELETE FROM contacts WHERE id IN (?)`, [duplicateIds]);
    }

    console.log('Duplicates resolved. Adding UNIQUE constraint...');
    
    // Check if constraint exists before adding
    const [indexes] = await pool.query("SHOW INDEX FROM contacts WHERE Key_name = 'idx_business_phone'");
    if (indexes.length === 0) {
      await pool.query('ALTER TABLE contacts ADD UNIQUE INDEX idx_business_phone (business_id, phone)');
      console.log('UNIQUE constraint added successfully.');
    } else {
      console.log('Constraint already exists.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

dedupe();
