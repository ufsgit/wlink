/**
 * Sends an Instagram DM to a user by username.
 * 
 * IMPORTANT: Instagram Graph API requires the recipient to have previously
 * messaged your business account (within 7 days) OR have opted in.
 * You cannot cold-message an Instagram user unless they initiated contact first.
 *
 * This script:
 *   1. Looks up the IGSID for a given username via the Graph API
 *   2. Sends a text message to that IGSID
 *
 * Usage:  node scratch/send_ig_message.js
 */

const axios = require('axios');
const pool  = require('../src/db/pool');
require('dotenv').config();

// ──────────────────── CONFIG ────────────────────
const TARGET_USERNAME = '_kallan_77';   // The Instagram username to message
const MESSAGE_TEXT    = 'Hello! This is a test message from WLink.';
const BUSINESS_ID     = 1;             // DB businesses.id that has ig_token configured
const GRAPH_VERSION   = 'v18.0';
const BASE_URL        = `https://graph.facebook.com/${GRAPH_VERSION}`;
// ────────────────────────────────────────────────

async function getCredentials() {
  const [rows] = await pool.query(
    'SELECT ig_token, ig_account_id FROM businesses WHERE id = ?',
    [BUSINESS_ID]
  );
  if (!rows.length || !rows[0].ig_token) {
    throw new Error(`No Instagram token found for business ID ${BUSINESS_ID}`);
  }
  return { token: rows[0].ig_token, accountId: rows[0].ig_account_id };
}

async function lookupIGSID(username, token, igAccountId) {
  console.log(`🔍 Looking up IGSID for @${username}...`);
  try {
    // Search for the user via the IG account's connected_instagram_accounts
    const res = await axios.get(`${BASE_URL}/${igAccountId}`, {
      params: {
        fields: `business_discovery.fields(id,username)`,
        // This requires pages_read_engagement + instagram_manage_messages permissions
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Account info:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('ℹ️  business_discovery lookup failed:', err.response?.data?.error?.message || err.message);
  }

  // Try direct username search via IG User Search
  console.log('\n🔍 Attempting username → IGSID resolution...');
  try {
    const searchRes = await axios.get(`${BASE_URL}/${igAccountId}/ig_media`, {
      params: {
        fields: 'username,from',
        limit: 50,
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    // Look through recent media commenters/messengers
    console.log('Media search result:', JSON.stringify(searchRes.data, null, 2));
  } catch (err) {
    console.log('ℹ️  ig_media lookup:', err.response?.data?.error?.message || err.message);
  }

  // The correct approach: search existing conversations for the username
  console.log('\n🔍 Searching existing DB conversations for known IGSID...');
  const [contacts] = await pool.query(
    "SELECT id, name, phone FROM contacts WHERE business_id = ? AND channel_preference = 'instagram'",
    [BUSINESS_ID]
  );
  console.log('Known Instagram contacts in DB:', contacts);

  const [igContacts] = await pool.query(
    `SELECT co.id, co.name, co.phone 
     FROM contacts co 
     JOIN conversations c ON co.id = c.contact_id 
     WHERE c.channel = 'instagram' AND co.business_id = ?`,
    [BUSINESS_ID]
  );
  console.log('Instagram conversation contacts in DB:', igContacts);
  return null;
}

async function sendMessage(recipientId, text, token) {
  console.log(`\n📤 Sending message to IGSID: ${recipientId}`);
  try {
    const res = await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message:   { text }
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Message sent successfully!', res.data);
  } catch (err) {
    console.error('❌ Send failed:', JSON.stringify(err.response?.data, null, 2) || err.message);
  }
}

async function main() {
  try {
    const { token, accountId } = await getCredentials();
    console.log(`✅ Using IG Account ID: ${accountId}`);
    console.log(`✅ Token starts with: ${token.slice(0, 20)}...`);

    const igsid = await lookupIGSID(TARGET_USERNAME, token, accountId);

    if (!igsid) {
      console.log(`\n⚠️  Could not resolve IGSID for @${TARGET_USERNAME}.`);
      console.log('───────────────────────────────────────────────────');
      console.log('Instagram API RESTRICTION:');
      console.log('  You can only send DMs to users who have ALREADY');
      console.log('  messaged your business account first.');
      console.log('  The recipient must initiate the conversation.');
      console.log('  Once they do, their IGSID will appear in the DB.');
      console.log('');
      console.log('SOLUTION: Ask @_kallan_77 to send your IG account');
      console.log('  a DM first. Then their IGSID will be saved in');
      console.log('  the contacts table and you can reply from WLink.');
      console.log('───────────────────────────────────────────────────');
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
