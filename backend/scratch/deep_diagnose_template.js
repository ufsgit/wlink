const axios = require('axios');
const pool = require('../src/db/pool');

const TOKEN = "EAATdyBuvzJ8BRo2auZCS3z6II3J7D15NIv5rZC9xl82Sd34zu2YPvMz2avD9fSGVNBQhxvKW3RrqHxvGTkCwbTqB4gg5yMp5ajOVNOE9tiZAXQVzdwqnO3vPu8rGZBoeHbNekejb6VECJbPElCjfrxPuYwuYSbx8bfRcS5d7qeTKE6YLJNTlJKqbFqltgv5NKQZDZD";
const PHONE_ID = "1111638082035391";
const WABA_ID = "1878121792827350";

async function deepDiagnose() {
  // 1. Check if any status webhook updates came in for recent messages
  console.log("=== 1. Recent Message Statuses in DB ===");
  try {
    const [msgs] = await pool.query(
      "SELECT id, conversation_id, direction, content, message_type, wa_message_id, status, created_at FROM messages ORDER BY id DESC LIMIT 10"
    );
    msgs.forEach(m => {
      console.log(`  [${m.id}] ${m.direction} | type: ${m.message_type} | status: ${m.status} | wa_id: ${m.wa_message_id} | ${m.created_at}`);
    });
  } catch (e) {
    console.error("DB error:", e.message);
  }

  // 2. Check WABA account currency and payment setup
  console.log("\n=== 2. WABA Account Details ===");
  try {
    const res = await axios.get(`https://graph.facebook.com/v22.0/${WABA_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { fields: 'name,currency,account_review_status,business_verification_status,ownership_type,primary_funding_id,purchase_order_number' }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("WABA error:", e.response?.data || e.message);
  }

  // 3. Check WABA credit line / payment method
  console.log("\n=== 3. Checking Payment/Credit Line ===");
  try {
    const res = await axios.get(`https://graph.facebook.com/v22.0/${WABA_ID}/`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { fields: 'primary_funding_id' }
    });
    console.log("Primary funding ID:", res.data.primary_funding_id || "NOT SET");
    
    if (!res.data.primary_funding_id) {
      console.log("\n⚠️  NO PAYMENT METHOD CONFIGURED!");
      console.log("   Marketing templates REQUIRE a valid payment method.");
      console.log("   Go to: Meta Business Suite → WhatsApp Manager → Account tools → Payment methods");
    }
  } catch (e) {
    console.error("Payment check error:", e.response?.data || e.message);
  }

  // 4. Check phone number messaging limits
  console.log("\n=== 4. Phone Number Messaging Limits ===");
  try {
    const res = await axios.get(`https://graph.facebook.com/v22.0/${PHONE_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { fields: 'display_phone_number,messaging_limit_tier,throughput,health_status,is_official_business_account' }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Limit check error:", e.response?.data || e.message);
  }

  // 5. Try sending a "hello_world" default template (UTILITY category) to compare
  console.log("\n=== 5. Listing ALL templates with categories ===");
  try {
    const res = await axios.get(`https://graph.facebook.com/v22.0/${WABA_ID}/message_templates`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { limit: 50 }
    });
    const templates = res.data.data || [];
    templates.forEach(t => {
      console.log(`  ${t.name} | category: ${t.category} | status: ${t.status} | language: ${t.language}`);
    });

    // Check if hello_world exists
    const hw = templates.find(t => t.name === 'hello_world');
    if (hw) {
      console.log("\n=== 6. Trying hello_world template (default utility) ===");
      try {
        const sendRes = await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
          messaging_product: 'whatsapp',
          to: '919048501094',
          type: 'template',
          template: { name: 'hello_world', language: { code: hw.language } }
        }, { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
        console.log("hello_world result:", JSON.stringify(sendRes.data, null, 2));
      } catch (e) {
        console.error("hello_world send error:", e.response?.data || e.message);
      }
    }
  } catch (e) {
    console.error("Template list error:", e.response?.data || e.message);
  }

  process.exit(0);
}

deepDiagnose();
