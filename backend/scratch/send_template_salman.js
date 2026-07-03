const axios = require('axios');
const pool = require('../src/db/pool');

const TOKEN = "EAATdyBuvzJ8BRo2auZCS3z6II3J7D15NIv5rZC9xl82Sd34zu2YPvMz2avD9fSGVNBQhxvKW3RrqHxvGTkCwbTqB4gg5yMp5ajOVNOE9tiZAXQVzdwqnO3vPu8rGZBoeHbNekejb6VECJbPElCjfrxPuYwuYSbx8bfRcS5d7qeTKE6YLJNTlJKqbFqltgv5NKQZDZD";
const PHONE_ID = "1111638082035391";

async function sendToSalman() {
  try {
    // 1. Find Salman's contact
    const [contacts] = await pool.query(
      "SELECT id, name, phone FROM contacts WHERE name LIKE '%salman%' OR name LIKE '%Salman%' LIMIT 5"
    );
    console.log("Contacts found:", JSON.stringify(contacts, null, 2));

    if (!contacts.length) {
      console.log("No contact named 'Salman' found. Checking all contacts...");
      const [all] = await pool.query("SELECT id, name, phone FROM contacts LIMIT 10");
      console.log("All contacts:", JSON.stringify(all, null, 2));
      process.exit(0);
      return;
    }

    const salman = contacts[0];
    console.log(`\nSending template to: ${salman.name} (${salman.phone})`);

    // 2. Send template
    const res = await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: salman.phone,
      type: 'template',
      template: {
        name: 'maintenance_support_message',
        language: { code: 'en' }
      }
    }, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    });

    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    process.exit(1);
  }
}

sendToSalman();
