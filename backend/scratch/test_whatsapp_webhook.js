const axios = require('axios');

async function testWebhook() {
  const payload = {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "1544843497009658",
        "changes": [
          {
            "field": "messages",
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "15556377030",
                "phone_number_id": "1010252335515897"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Salman"
                  },
                  "wa_id": "919895095713"
                }
              ],
              "messages": [
                {
                  "from": "919895095713",
                  "id": "wamid.TEST_MSG_" + Date.now(),
                  "timestamp": Math.floor(Date.now() / 1000).toString(),
                  "text": {
                    "body": "Hello from WLink test webhook!"
                  },
                  "type": "text"
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    console.log('Sending mock WhatsApp webhook payload...');
    const response = await axios.post('http://localhost:3000/api/webhooks/whatsapp', payload);
    console.log('Status Code:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending webhook:', error.response ? error.response.data : error.message);
  }
}

testWebhook();
