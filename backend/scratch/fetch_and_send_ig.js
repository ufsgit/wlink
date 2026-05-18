/**
 * Fetches recent Instagram conversations from Graph API
 * to find the IGSID of @_kallan_77
 */
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BUSINESS_ID   = 1;
const GRAPH_VERSION = 'v18.0';
const BASE_URL      = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const [[biz]] = await conn.query(
    'SELECT ig_token, ig_account_id FROM businesses WHERE id = ?',
    [BUSINESS_ID]
  );

  if (!biz?.ig_token) {
    console.error('❌ No Instagram token configured for business', BUSINESS_ID);
    process.exit(1);
  }

  const { ig_token: token, ig_account_id: igAccountId } = biz;
  console.log(`✅ IG Account ID: ${igAccountId}`);

  // ── 1. Fetch recent conversations ──────────────────────────────────────────
  console.log('\n📬 Fetching recent IG conversations from Graph API...');
  try {
    const res = await axios.get(`${BASE_URL}/${igAccountId}/conversations`, {
      params: {
        platform: 'instagram',
        fields: 'participants,messages{message,from,created_time}',
        limit: 10
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    const convos = res.data.data || [];
    console.log(`Found ${convos.length} conversation(s)\n`);

    let kallanIGSID = null;

    for (const convo of convos) {
      const participants = convo.participants?.data || [];
      console.log('👥 Participants:', participants.map(p => `${p.name} (${p.id})`).join(', '));

      // Find participant that is NOT the business account
      const user = participants.find(p => p.id !== igAccountId);
      if (user) {
        const username = user.username || user.name || '';
        console.log(`  → User: ${username} | IGSID: ${user.id}`);

        if (username.toLowerCase().includes('kallan') ||
            user.id === '_kallan_77') {
          kallanIGSID = user.id;
          console.log(`  🎯 Found @_kallan_77! IGSID = ${kallanIGSID}`);
        }

        // Show recent messages
        const msgs = convo.messages?.data || [];
        for (const m of msgs.slice(0, 3)) {
          console.log(`    [${m.from?.name}]: ${m.message || '(no text)'} @ ${m.created_time}`);
        }
      }
      console.log('---');
    }

    if (!kallanIGSID) {
      console.log('\n⚠️  @_kallan_77 not found in API conversations.');
      console.log('Possible reasons:');
      console.log('  1. The webhook missed their message (ngrok URL changed)');
      console.log('  2. They messaged but the conversation is not in the API response');
      console.log('  3. The token lacks instagram_manage_messages permission');
      console.log('\nAll found IGSIDs above — if you recognise @_kallan_77\'s IGSID,');
      console.log('update the script and run send_ig_message.js with that ID.');
    } else {
      // ── 2. Save to DB and send a message ──────────────────────────────────
      console.log(`\n📤 Sending message to @_kallan_77 (IGSID: ${kallanIGSID})...`);

      // Upsert contact in DB
      const [existing] = await conn.query(
        "SELECT id FROM contacts WHERE business_id = ? AND phone = ?",
        [BUSINESS_ID, kallanIGSID]
      );
      let contactId;
      if (!existing.length) {
        const [ins] = await conn.query(
          "INSERT INTO contacts (business_id, phone, name) VALUES (?, ?, ?)",
          [BUSINESS_ID, kallanIGSID, 'IG__kallan_77']
        );
        contactId = ins.insertId;
        console.log('✅ Contact created in DB:', contactId);
      } else {
        contactId = existing[0].id;
        console.log('✅ Contact already in DB:', contactId);
      }

      // Send via Graph API
      const msgRes = await axios.post(
        `${BASE_URL}/me/messages`,
        {
          recipient: { id: kallanIGSID },
          message:   { text: 'Hello! 👋 This is a message from WLink Shared Inbox.' }
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      console.log('✅ Message sent!', msgRes.data);

      // Log outbound message in DB
      const [convoRow] = await conn.query(
        "SELECT id FROM conversations WHERE contact_id = ? AND channel = 'instagram' LIMIT 1",
        [contactId]
      );
      if (convoRow.length) {
        await conn.query(
          "INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')",
          [convoRow[0].id, 'Hello! 👋 This is a message from WLink Shared Inbox.']
        );
        console.log('✅ Message logged in DB.');
      }
    }
  } catch (err) {
    console.error('❌ API Error:', JSON.stringify(err.response?.data, null, 2) || err.message);
  } finally {
    await conn.end();
  }
}

main();
