require('dotenv').config();
const WhatsappService = require('./src/services/WhatsappService');
const service = new WhatsappService();

const RECIPIENT = '919048501094'; // Salman
const BUSINESS_ID = 1; // Assuming your biz ID is 1

async function test() {
  const result = await service.sendMediaMessage(
    RECIPIENT,
    'audio',
    '/uploads/upload_1780560976037.m4a', // Using the m4a file we know exists locally
    '',
    BUSINESS_ID
  );
  console.log("Result:", JSON.stringify(result, null, 2));
  process.exit(0);
}
test();
