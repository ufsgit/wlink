const pool = require('../db/pool');
const { processChatbotFlow } = require('../controllers/chatbots.controller');
const WhatsappService = require('../services/WhatsappService');

// Helper: send bot reply with detailed logging + text fallback if interactive fails
async function sendBotReply(to, result, bizId, convId, socialAccountId = null) {
  try {
    const bizParam = { businessId: bizId, socialAccountId };
    if (result.interactive) {
      console.log('[Bot] Sending interactive message to', to, JSON.stringify(result.interactive, null, 2));
      const sendResult = await WhatsappService.sendInteractiveMessage(to, result.interactive, bizParam);
      if (!sendResult.success) {
        console.error('[Bot] Interactive send FAILED:', sendResult.message, '— falling back to text');
        // Fall back to plain text with button options listed
        const buttons = result.interactive.action?.buttons || [];
        const optionsText = buttons.map((b, i) => `${i + 1}. ${b.reply?.title}`).join('\n');
        const fallbackText = `${result.interactive.body?.text}\n\n${optionsText}`;
        await WhatsappService.sendTextMessage(to, fallbackText, bizParam);
        if (convId) await pool.query("INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')", [convId, fallbackText]);
        return;
      }
      console.log('[Bot] Interactive message sent successfully');
    } else if (result.response) {
      console.log('[Bot] Sending text message to', to, ':', result.response);
      const sendResult = await WhatsappService.sendTextMessage(to, result.response, bizParam);
      if (!sendResult.success) {
        console.error('[Bot] Text send FAILED:', sendResult.message);
      }
    }
    // Save bot message to DB
    if (result.response && convId) {
      await pool.query("INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')", [convId, result.response]);
    }
  } catch (err) {
    console.error('[Bot] sendBotReply error:', err.message);
  }
}

async function handleWhatsappWebhook(req, res, io) {
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('--- Webhook Body ---');
    console.log(JSON.stringify(req.body, null, 2));
  } else {
    console.log('--- Webhook Body is EMPTY ---');
  }

  // Verification for webhook setup
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('--- Verification Attempt ---');
    console.log('Mode:', mode);
    console.log('Token Received:', token);
    console.log('Challenge:', challenge);

    if (mode === 'subscribe') {
      const [rows] = await pool.query('SELECT id FROM businesses WHERE fb_verify_token=?', [token]);
      console.log('Database Match Found:', rows.length > 0);

      if (token === '12345' || token === process.env.FB_VERIFY_TOKEN || rows.length > 0) {
        console.log('✅ Webhook Verified Successfully');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Webhook Verification Failed: Token mismatch');
      }
    }
    return res.sendStatus(403);
  }

  // Process incoming messages
  try {
    const body = req.body;

    if (!body.object || body.object !== 'whatsapp_business_account') return res.sendStatus(200);

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const messages = value.messages || [];
        const statuses = value.statuses || [];
        const phoneId = value.metadata?.phone_number_id;

        console.log(`Processing ${messages.length} messages for Phone ID: ${phoneId}`);

        // Handle incoming messages
        for (const msg of messages) {
          const from = msg.from;
          const msgId = msg.id;
          
          // Find business and social account by phone_id (with fallback for Meta test ID)
          let [accounts] = await pool.query('SELECT id, business_id FROM social_accounts WHERE platform="whatsapp" AND phone_id=? AND is_active=1', [phoneId]);
          let bizId, socialAccountId = null;
          if (accounts.length) {
            bizId = accounts[0].business_id;
            socialAccountId = accounts[0].id;
          } else {
            let [businesses] = await pool.query('SELECT id FROM businesses WHERE whatsapp_phone_id=?', [phoneId]);
            if (!businesses.length && (phoneId === '123456123' || !phoneId)) {
              [businesses] = await pool.query('SELECT id FROM businesses LIMIT 1');
            }
            if (businesses.length) {
              bizId = businesses[0].id;
            }
          }
          
          if (!bizId) continue;

          // Auto-mark as read
          await WhatsappService.markAsRead(msgId, { businessId: bizId, socialAccountId });

          let text = msg.text?.body || msg.caption || '';
          const msgType = msg.type || 'text';

          // Handle interactive responses
          if (msgType === 'interactive') {
            const interactive = msg.interactive;
            if (interactive.type === 'button_reply') {
              text = interactive.button_reply.title; // or .id
            } else if (interactive.type === 'list_reply') {
              text = interactive.list_reply.title; // or .id
            }
          }

          // Find or create contact
          let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, from]);
          let contactId;
          if (!contacts.length) {
            const [result] = await pool.query("INSERT INTO contacts (business_id, phone, opted_in, opt_in_source, tags) VALUES (?, ?, 1, 'whatsapp', '[\"lead\"]')", [bizId, from]);
            contactId = result.insertId;
          } else {
            contactId = contacts[0].id;
          }

          // Find or create conversation
          let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status!='resolved' LIMIT 1", [bizId, contactId]);
          let convId;
          if (!convos.length) {
            const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at, social_account_id) VALUES (?, ?, 'whatsapp', NOW(), ?)", [bizId, contactId, socialAccountId]);
            convId = result.insertId;
          } else {
            convId = convos[0].id;
            await pool.query('UPDATE conversations SET last_message_at=NOW(), social_account_id=COALESCE(social_account_id, ?) WHERE id=?', [socialAccountId, convId]);
          }

          // Store message
          const [msgResult] = await pool.query(
            'INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id) VALUES (?, ?, ?, ?, ?)',
            [convId, 'inbound', text, msgType, msg.id]
          );

          // Emit to socket
          if (io) {
            const [newMsg] = await pool.query('SELECT * FROM messages WHERE id=?', [msgResult.insertId]);
            io.to(`biz_${bizId}`).emit('new_message', { conversationId: convId, message: newMsg[0] });
            io.to(`biz_${bizId}`).emit('conversation_updated', { conversationId: convId });
          }

          // Check for chatbot trigger
          const [convDetails] = await pool.query('SELECT assigned_to, status FROM conversations WHERE id=?', [convId]);
          const isAssigned = convDetails.length && convDetails[0].assigned_to;
          
          if (!isAssigned) {
            const [sessionRows] = await pool.query('SELECT * FROM chatbot_sessions WHERE contact_id=? ORDER BY started_at DESC LIMIT 1', [contactId]);
            let session = sessionRows[0] || null;
            const [bots] = await pool.query("SELECT * FROM chatbots WHERE business_id=? AND is_active=1 AND channel='whatsapp'", [bizId]);
            let botTriggered = false;
            for (const bot of bots) {
              const keywords = bot.trigger_keywords || [];
              const isSessionActive = session && session.chatbot_id === bot.id;
              const isKeywordMatch = keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));

              // If keyword matched and session is active, reset session to start fresh from node 1
              if (isKeywordMatch && isSessionActive) {
                await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
                session = null;
              }
              
              if (isSessionActive || isKeywordMatch) {
                const result = await processChatbotFlow(bot, contactId, text, { businessId: bizId, socialAccountId });
                console.log('[Bot] Flow result:', JSON.stringify(result));
                await sendBotReply(from, result, bizId, convId, socialAccountId);
                botTriggered = true;
                break; 
              }
            }

            // Fallback to a Welcome/Main Menu bot if it's a new session and no bot triggered
            if (!botTriggered) {
              const welcomeBot = bots.find(b =>
                (b.name.toLowerCase().includes('welcome') || b.name.toLowerCase().includes('main menu')) ||
                (b.ai_enabled && (!b.trigger_keywords || b.trigger_keywords.length === 0 || b.trigger_keywords.includes('*')))
              );

              if (welcomeBot) {
                const result = await processChatbotFlow(welcomeBot, contactId, text, { businessId: bizId, socialAccountId });
                console.log('[Bot] Welcome flow result:', JSON.stringify(result));
                await sendBotReply(from, result, bizId, convId, socialAccountId);
              }
            }
          }
        }

        // Handle delivery status updates
        for (const status of statuses) {
          const waId = status.id;
          const newStatus = status.status; // sent, delivered, read, failed
          await pool.query('UPDATE messages SET status=? WHERE wa_message_id=?', [newStatus, waId]);
          await pool.query('UPDATE broadcast_logs SET status=? WHERE wa_message_id=?', [newStatus, waId]);
          if (newStatus === 'delivered') {
            await pool.query(
              'UPDATE broadcasts SET total_delivered=total_delivered+1 WHERE id IN (SELECT broadcast_id FROM broadcast_logs WHERE wa_message_id=?)',
              [waId]
            );
          } else if (newStatus === 'read') {
            await pool.query(
              'UPDATE broadcasts SET total_read=total_read+1 WHERE id IN (SELECT broadcast_id FROM broadcast_logs WHERE wa_message_id=?)',
              [waId]
            );
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.sendStatus(200);
  }
}

module.exports = { handleWhatsappWebhook };
