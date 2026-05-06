const WhatsappService = require('./src/services/WhatsappService');
const pool = require('./src/db/pool');

async function sendRealMessage() {
  const targetNumber = '919895095713';
  const businessId = 1; // Demo Business
  const messageText = 'Hello! This is a REAL message sent from your UrbanChat software system. 🚀';

  console.log(`Attempting to send real WhatsApp message to ${targetNumber}...`);

  try {
    const result = await WhatsappService.sendTextMessage(targetNumber, messageText, businessId);
    
    if (result.success) {
      console.log('✅ Message SENT SUCCESSFULLY!');
      console.log('WhatsApp Message ID:', result.data.messages[0].id);
    } else {
      console.error('❌ FAILED to send message.');
      console.error('Error Details:', result.message);
      
      if (result.message.includes('24 hours')) {
        console.log('\n--- IMPORTANT ---');
        console.log('WhatsApp requires you to send a TEMPLATE message first if the user hasn\'t messaged you recently.');
      }
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err.message);
  } finally {
    await pool.end();
  }
}

sendRealMessage();
