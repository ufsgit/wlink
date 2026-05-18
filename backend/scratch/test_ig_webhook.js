const axios = require('axios');

const payload = {
  object: 'instagram',
  entry: [
    {
      id: '17841419844497813',
      time: Date.now(),
      messaging: [
        {
          sender: { id: 'sender_test_user' },
          recipient: { id: '17841419844497813' },
          timestamp: Date.now(),
          message: {
            mid: 'test_message_id_' + Date.now(),
            text: 'Hello from test script! Testing IG message flow.'
          }
        }
      ]
    }
  ]
};

async function testWebhook() {
  try {
    const response = await axios.post('http://localhost:3000/api/webhooks/instagram', payload);
    console.log('Webhook Status:', response.status);
    console.log('Webhook Response:', response.data);
  } catch (error) {
    console.error('Error testing webhook:', error.response ? error.response.data : error.message);
  }
}

testWebhook();
