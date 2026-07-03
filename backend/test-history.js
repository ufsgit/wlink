const pool = require('./src/db/pool');

async function test() {
  const contactId = '104';
  const bizId = 3;
  const role = 'admin';
  const userId = 1;

  let q = 'SELECT id FROM contacts WHERE id = ? AND business_id = ?';
  const params = [contactId, bizId];
  if (role === 'agent') {
    q += ' AND assigned_to = ?';
    params.push(userId);
  }
  const [contacts] = await pool.query(q, params);
  console.log('Contacts:', contacts);

  const [history] = await pool.query(`
    SELECT ch.*, u.name as changed_by_name 
    FROM contact_history ch 
    LEFT JOIN users u ON ch.user_id = u.id 
    WHERE ch.contact_id = ? AND ch.business_id = ? 
    ORDER BY ch.created_at DESC
  `, [contactId, bizId]);
  
  console.log('History:', history);
  process.exit(0);
}
test();
