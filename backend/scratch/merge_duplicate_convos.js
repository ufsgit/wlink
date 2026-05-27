/**
 * One-time script to merge duplicate conversations for the same contact.
 * Keeps the oldest conversation and moves messages from newer duplicates into it.
 */
require('dotenv').config();
const pool = require('../src/db/pool');

async function mergeDuplicates() {
  console.log('🔍 Finding duplicate conversations (same contact_id + channel)...\n');
  
  // Find contacts with more than one conversation on the same channel
  const [dupes] = await pool.query(`
    SELECT contact_id, channel, COUNT(*) as cnt, GROUP_CONCAT(id ORDER BY created_at ASC) as conv_ids
    FROM conversations 
    GROUP BY contact_id, channel 
    HAVING cnt > 1
  `);

  if (!dupes.length) {
    console.log('✅ No duplicate conversations found. Database is clean!');
    process.exit(0);
  }

  console.log(`Found ${dupes.length} sets of duplicate conversations:\n`);

  for (const dupe of dupes) {
    const ids = dupe.conv_ids.split(',').map(Number);
    const keepId = ids[0]; // Keep the oldest
    const removeIds = ids.slice(1); // Remove the rest

    console.log(`  Contact ${dupe.contact_id} (${dupe.channel}): keeping #${keepId}, merging ${removeIds.join(', ')} into it`);

    // Move all messages from duplicate conversations into the keeper
    for (const removeId of removeIds) {
      const [msgs] = await pool.query('SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?', [removeId]);
      console.log(`    → Moving ${msgs[0].cnt} messages from conversation #${removeId} → #${keepId}`);
      
      await pool.query('UPDATE messages SET conversation_id = ? WHERE conversation_id = ?', [keepId, removeId]);
    }

    // Update the keeper: set status to open, refresh last_message_at
    await pool.query(`
      UPDATE conversations SET 
        status = 'open',
        last_message_at = (SELECT MAX(sent_at) FROM messages WHERE conversation_id = ?)
      WHERE id = ?
    `, [keepId, keepId]);

    // Delete the duplicate conversations (messages already moved)
    await pool.query('DELETE FROM conversations WHERE id IN (?)', [removeIds]);
    console.log(`    ✅ Deleted ${removeIds.length} duplicate conversation(s)\n`);
  }

  console.log('🎉 All duplicates merged successfully!');
  process.exit(0);
}

mergeDuplicates().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
