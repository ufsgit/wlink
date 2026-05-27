const http = require('http');

const payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "field": "messages",
          "value": {
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "123456123"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": `wamid.test_${Date.now()}`,
                "timestamp": Math.floor(Date.now() / 1000).toString(),
                "text": {
                  "body": "Hello! Will my WhatsApp receive this message?"
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

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/whatsapp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
