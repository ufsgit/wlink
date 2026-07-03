const axios = require('axios');
require('dotenv').config();

const TOKEN = "EAATdyBuvzJ8BRo2auZCS3z6II3J7D15NIv5rZC9xl82Sd34zu2YPvMz2avD9fSGVNBQhxvKW3RrqHxvGTkCwbTqB4gg5yMp5ajOVNOE9tiZAXQVzdwqnO3vPu8rGZBoeHbNekejb6VECJbPElCjfrxPuYwuYSbx8bfRcS5d7qeTKE6YLJNTlJKqbFqltgv5NKQZDZD";
const PHONE_ID = "1111638082035391";
const RECIPIENT = '919048501094'; // Salman

async function testVoice() {
  try {
    const ngrokRes = await axios.get('http://127.0.0.1:4040/api/tunnels');
    const publicUrl = ngrokRes.data.tunnels[0].public_url;
    console.log("Ngrok URL:", publicUrl);

    // Provide a valid media URL. Assuming there's a voice file in uploads.
    // Let's use one of the files from the console logs: /uploads/upload_1779876781245.ogg
    const mediaUrl = `${publicUrl}/uploads/upload_1779876781245.ogg`;
    console.log("Sending media:", mediaUrl);

    // Let's check if the file is reachable locally first
    try {
       const check = await axios.head(mediaUrl);
       console.log("Media is reachable locally:", check.status);
    } catch(e) {
       console.log("Media not reachable:", e.message);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'audio',
      audio: {
        link: mediaUrl
      }
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    const res = await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, payload, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    });
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("ERROR:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

testVoice();
