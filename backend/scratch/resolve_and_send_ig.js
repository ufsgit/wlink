/**
 * Alternative approach: use the Facebook Page connected to the IG account
 * to fetch conversations and find @_kallan_77's IGSID.
 *
 * Also tries to send via page-scoped messaging.
 */
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const TARGET_USERNAME = '_kallan_77';
const MESSAGE_TEXT    = 'Hello! 👋 Reaching out from WLink.';
const BUSINESS_ID     = 1;
const GRAPH_VERSION   = 'v18.0';
const BASE_URL        = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  const [[biz]] = await conn.query(
    'SELECT ig_token, ig_account_id FROM businesses WHERE id = ?', [BUSINESS_ID]
  );
  const { ig_token: token, ig_account_id: igAccountId } = biz;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Step 1: Find the Facebook Page linked to this IG account ──────────────
  console.log('\n📄 Finding linked Facebook Pages...');
  let pageId = null;
  let pageToken = null;
  try {
    const res = await axios.get(`${BASE_URL}/me/accounts`, { headers });
    const pages = res.data.data || [];
    console.log(`Found ${pages.length} page(s):`);
    for (const page of pages) {
      console.log(`  • ${page.name} | ID: ${page.id}`);
      // Use the first page (or the one linked to IG)
      if (!pageId) {
        pageId = page.id;
        pageToken = page.access_token;
      }
    }
  } catch (err) {
    console.error('❌ Could not fetch pages:', err.response?.data?.error?.message || err.message);
  }

  if (!pageId) {
    console.log('❌ No Facebook Page found linked to this token.');
    await conn.end();
    return;
  }

  const pageHeaders = { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' };

  // ── Step 2: Fetch conversations on the Page (Instagram platform) ──────────
  console.log(`\n📬 Fetching Instagram conversations on Page ${pageId}...`);
  let igsid = null;
  try {
    const res = await axios.get(`${BASE_URL}/${pageId}/conversations`, {
      params: { platform: 'instagram', fields: 'id,participants', limit: 25 },
      headers: pageHeaders
    });
    const convos = res.data.data || [];
    console.log(`Found ${convos.length} Instagram conversation(s)\n`);

    const allUsers = [];
    for (const convo of convos) {
      for (const p of (convo.participants?.data || [])) {
        if (p.id !== igAccountId) {
          allUsers.push({ name: p.name, username: p.username || '?', id: p.id, convoId: convo.id });
          if (p.username && p.username.toLowerCase() === TARGET_USERNAME.toLowerCase()) {
            igsid = p.id;
            console.log(`🎯 Found @${TARGET_USERNAME}! IGSID = ${igsid}`);
          }
        }
      }
    }

    if (allUsers.length) {
      console.log('All conversation participants:');
      console.table(allUsers);
    }
  } catch (err) {
    console.error('❌ Page conversations error:', JSON.stringify(err.response?.data, null, 2) || err.message);
  }

  // ── Step 3: Send message ──────────────────────────────────────────────────
  if (igsid) {
    console.log(`\n📤 Sending message to @${TARGET_USERNAME} (IGSID: ${igsid})...`);
    try {
      // Try via IG account endpoint
      const res = await axios.post(`${BASE_URL}/me/messages`, {
        recipient: { id: igsid },
        message:   { text: MESSAGE_TEXT }
      }, { headers });
      console.log('✅ Message sent!', res.data);

      // Save to DB
      await saveMessageToDB(conn, BUSINESS_ID, igsid, TARGET_USERNAME, MESSAGE_TEXT);
    } catch (err) {
      console.error('❌ Send via /me/messages failed:', JSON.stringify(err.response?.data, null, 2));

      // Fallback: try via page
      console.log('Trying via Page endpoint...');
      try {
        const res2 = await axios.post(`${BASE_URL}/${pageId}/messages`, {
          recipient: { id: igsid },
          message:   { text: MESSAGE_TEXT },
          messaging_type: 'RESPONSE'
        }, { headers: pageHeaders });
        console.log('✅ Message sent via Page!', res2.data);
        await saveMessageToDB(conn, BUSINESS_ID, igsid, TARGET_USERNAME, MESSAGE_TEXT);
      } catch (err2) {
        console.error('❌ Send via Page also failed:', JSON.stringify(err2.response?.data, null, 2));
      }
    }
  } else {
    console.log(`\n⚠️  @${TARGET_USERNAME} was not found in any IG conversation.`);
    console.log('Possible causes:');
    console.log('  1. They messaged but ngrok URL was different — webhook missed it');
    console.log('  2. App is in Development mode — conversations API may be restricted');
    console.log('  3. Check if the conversation appears in your Instagram DM inbox directly');
  }

  await conn.end();
}

async function saveMessageToDB(conn, bizId, igsid, username, text) {
  const [existing] = await conn.query(
    'SELECT id FROM contacts WHERE business_id = ? AND phone = ?', [bizId, igsid]
  );
  let contactId;
  if (!existing.length) {
    const [ins] = await conn.query(
      'INSERT INTO contacts (business_id, phone, name) VALUES (?, ?, ?)',
      [bizId, igsid, `IG_${username}`]
    );
    contactId = ins.insertId;
  } else {
    contactId = existing[0].id;
  }

  const [convRows] = await conn.query(
    "SELECT id FROM conversations WHERE contact_id = ? AND channel = 'instagram' LIMIT 1",
    [contactId]
  );
  let convId;
  if (!convRows.length) {
    const [newConvo] = await conn.query(
      "INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'instagram', NOW())",
      [bizId, contactId]
    );
    convId = newConvo.insertId;
  } else {
    convId = convRows[0].id;
  }

  await conn.query(
    "INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')",
    [convId, text]
  );
  console.log('✅ Conversation + message saved to DB (convId:', convId + ')');
}

main().catch(console.error);
