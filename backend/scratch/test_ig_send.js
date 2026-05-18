const InstagramService = require('../src/services/InstagramService');

async function testSendMessage() {
  const businessId = 1; // From my previous DB query
  const recipientId = 'sender_test_user'; // The one I used in the webhook test
  const text = 'Reply from WLink backend!';

  console.log('Testing InstagramService.sendTextMessage...');
  const result = await InstagramService.sendTextMessage(recipientId, text, businessId);
  console.log('Result:', result);
}

testSendMessage();
