const axios = require('axios');

const TOKEN = "EAATdyBuvzJ8BRo2auZCS3z6II3J7D15NIv5rZC9xl82Sd34zu2YPvMz2avD9fSGVNBQhxvKW3RrqHxvGTkCwbTqB4gg5yMp5ajOVNOE9tiZAXQVzdwqnO3vPu8rGZBoeHbNekejb6VECJbPElCjfrxPuYwuYSbx8bfRcS5d7qeTKE6YLJNTlJKqbFqltgv5NKQZDZD";
const PHONE_ID = "1111638082035391";
const WABA_ID = "1878121792827350";

async function diagnose() {
  console.log("=== 1. Checking Phone Number Status ===");
  try {
    const phoneRes = await axios.get(`https://graph.facebook.com/v22.0/${PHONE_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { fields: 'display_phone_number,verified_name,quality_rating,account_mode,status,name_status,code_verification_status' }
    });
    console.log("Phone Info:", JSON.stringify(phoneRes.data, null, 2));
  } catch (err) {
    console.error("Phone check error:", err.response?.data || err.message);
  }

  console.log("\n=== 2. Listing Templates ===");
  try {
    const templatesRes = await axios.get(`https://graph.facebook.com/v22.0/${WABA_ID}/message_templates`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { limit: 5 }
    });
    const templates = templatesRes.data.data || [];
    console.log(`Found ${templates.length} templates:`);
    templates.forEach(t => {
      console.log(`  - ${t.name} | status: ${t.status} | language: ${t.language} | category: ${t.category}`);
    });
    
    // Try sending with the first APPROVED template
    const approved = templates.find(t => t.status === 'APPROVED');
    if (approved) {
      console.log(`\n=== 3. Attempting to send template "${approved.name}" ===`);
      try {
        const sendRes = await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
          messaging_product: 'whatsapp',
          to: '919746240273',  // test number - change if needed
          type: 'template',
          template: {
            name: approved.name,
            language: { code: approved.language }
          }
        }, { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
        console.log("SUCCESS:", JSON.stringify(sendRes.data, null, 2));
      } catch (err) {
        console.error("SEND FAILED:", JSON.stringify(err.response?.data, null, 2));
        const errorCode = err.response?.data?.error?.code;
        const errorSubcode = err.response?.data?.error?.error_subcode;
        console.log(`\nError code: ${errorCode}, Subcode: ${errorSubcode}`);
        
        if (errorCode === 131010 || errorCode === 133010) {
          console.log("\n>>> DIAGNOSIS: Phone number not registered. You need to complete phone registration in Meta Business Suite.");
        } else if (errorCode === 131047) {
          console.log("\n>>> DIAGNOSIS: Re-engagement message. More than 24hrs since last customer interaction, and template was rejected.");
        } else if (errorCode === 131026 || errorSubcode === 2388032) {
          console.log("\n>>> DIAGNOSIS: PAYMENT ISSUE! Your WhatsApp Business Account doesn't have a valid payment method or has run out of credits.");
          console.log("    Fix: Go to Meta Business Suite > Settings > WhatsApp > Payment Settings and add a payment method.");
        } else if (errorCode === 131042) {
          console.log("\n>>> DIAGNOSIS: Business eligibility issue. Your business may be restricted.");
        } else if (errorCode === 131031) {
          console.log("\n>>> DIAGNOSIS: Account not eligible for WhatsApp API.");
        } else if (errorCode === 100 && errorSubcode === 33) {
          console.log("\n>>> DIAGNOSIS: Parameter issue - check template parameters.");
        }
      }
    } else {
      console.log("\nNo APPROVED templates found! All templates may be pending review or rejected.");
    }
  } catch (err) {
    console.error("Template list error:", err.response?.data || err.message);
  }

  console.log("\n=== 4. Checking WABA Payment Info ===");
  try {
    const wabaRes = await axios.get(`https://graph.facebook.com/v22.0/${WABA_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { fields: 'name,currency,account_review_status,message_template_namespace,on_behalf_of_business_info' }
    });
    console.log("WABA Info:", JSON.stringify(wabaRes.data, null, 2));
  } catch (err) {
    console.error("WABA check error:", err.response?.data || err.message);
  }
}

diagnose();
