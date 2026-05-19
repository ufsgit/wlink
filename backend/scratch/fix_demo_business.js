const pool = require('../src/db/pool');

async function fixDemoBusiness() {
  try {
    console.log('Updating Demo Business (ID 1) credentials to prevent webhook hijacking...');
    
    const [result] = await pool.query(`
      UPDATE businesses 
      SET 
        whatsapp_phone_id = 'demo_whatsapp_phone_id',
        whatsapp_number = '+15550000000',
        fb_page_id = 'demo_fb_page_id',
        ig_account_id = 'demo_ig_account_id',
        waba_id = 'demo_waba_id'
      WHERE id = 1
    `);

    console.log('✅ Demo Business successfully updated!');
    console.log('Rows affected:', result.affectedRows);
    
    // Also, let's fix any existing conversations that were mistakenly associated with Demo Business (ID 1)
    // and move them to chilli & Co (ID 4) so you don't lose your previous test messages!
    const [convUpdate] = await pool.query(`
      UPDATE conversations 
      SET business_id = 4 
      WHERE business_id = 1 AND contact_id IN (
        SELECT id FROM contacts WHERE phone = '919895095713'
      )
    `);
    console.log(`✅ Moved ${convUpdate.affectedRows} hijacked conversations/messages to Business ID 4!`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating Demo Business:', err.message);
    process.exit(1);
  }
}

fixDemoBusiness();
