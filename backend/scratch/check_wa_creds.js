const pool = require('../src/db/pool');

async function check() {
  try {
    const [rows] = await pool.query(
      "SELECT id, platform, token, phone_id, waba_id, is_active FROM social_accounts WHERE platform='whatsapp' AND is_active=1"
    );
    console.log('WhatsApp accounts:', JSON.stringify(rows, null, 2));

    // Also check business table fallback
    const [biz] = await pool.query('SELECT id, whatsapp_token, whatsapp_phone_id FROM businesses');
    console.log('Business table:', JSON.stringify(biz, null, 2));

    // Check env vars
    console.log('ENV WHATSAPP_TOKEN:', process.env.WHATSAPP_TOKEN ? 'SET' : 'EMPTY');
    console.log('ENV WHATSAPP_PHONE_ID:', process.env.WHATSAPP_PHONE_ID ? process.env.WHATSAPP_PHONE_ID : 'EMPTY');

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

check();
