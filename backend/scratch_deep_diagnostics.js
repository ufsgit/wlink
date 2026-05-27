const pool = require('./src/db/pool');

async function testDelete() {
  try {
    // Let's find one conversation and try to delete it to see the exact SQL error
    const [convo] = await pool.query('SELECT * FROM conversations LIMIT 1');
    if (!convo.length) {
      console.log('No conversations found to test');
      process.exit(0);
    }
    const convId = convo[0].id;
    console.log('Testing delete on conversation ID:', convId);

    // Let's run a transaction or just try dry run of deletions to see foreign key errors
    await pool.query('START TRANSACTION');
    
    console.log('Attempting message delete...');
    await pool.query('DELETE FROM messages WHERE conversation_id = ?', [convId]);
    
    console.log('Attempting conversation delete...');
    await pool.query('DELETE FROM conversations WHERE id = ?', [convId]);
    
    console.log('SUCCESS! Rollback transaction...');
    await pool.query('ROLLBACK');
  } catch (err) {
    console.error('SQL Error details:', err);
    try { await pool.query('ROLLBACK'); } catch(e) {}
  }
  process.exit(0);
}

testDelete();
