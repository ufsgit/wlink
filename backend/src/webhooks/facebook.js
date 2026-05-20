const pool = require('../db/pool');
const { processChatbotFlow } = require('../controllers/chatbots.controller');

async function handleFacebookWebhook(req, res, io) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Check if the verify token matches process.env or a business in DB
    const [rows] = await pool.query('SELECT id FROM businesses WHERE fb_verify_token=?', [token]);
    if (mode === 'subscribe' && (token === '12345' || token === process.env.FB_VERIFY_TOKEN || rows.length > 0)) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  try {
    const body = req.body;
    console.log('📬 Incoming Facebook Webhook:', JSON.stringify(body, null, 2));
    const entries = body.entry || [];
    for (const entry of entries) {
      const pageId = entry.id;

      // Find business and social account by platform and ID
      let [accounts] = await pool.query(
        "SELECT id, business_id FROM social_accounts WHERE platform='facebook' AND (app_id=? OR account_id=?) AND is_active=1", 
        [pageId, pageId]
      );
      
      let bizId, socialAccountId = null;
      if (accounts.length) {
        bizId = accounts[0].business_id;
        socialAccountId = accounts[0].id;
      } else {
        const [businesses] = await pool.query('SELECT id FROM businesses WHERE fb_page_id=?', [pageId]);
        if (!businesses.length) {
          console.log('⚠️ No business found for FB Page ID:', pageId);
          continue;
        }
        bizId = businesses[0].id;
      }

      const messaging = entry.messaging || [];
      for (const event of messaging) {
        try {
          const senderId = event.sender?.id;
          const text = event.message?.text || '';
          console.log(`📡 FB Event: Sender=${senderId}, Text=${text}`);
          if (!senderId || !text) continue;

          // Find or create contact
          let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, senderId]);
          let contactId;
          if (!contacts.length) {
            const [result] = await pool.query('INSERT INTO contacts (business_id, phone, name) VALUES (?, ?, ?)', [bizId, senderId, `FB_${senderId}`]);
            contactId = result.insertId;
          } else {
            contactId = contacts[0].id;
          }

          // Find or create conversation
          let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND channel='facebook' AND status!='resolved' LIMIT 1", [bizId, contactId]);
          let convId;
          if (!convos.length) {
            const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at, social_account_id) VALUES (?, ?, 'facebook', NOW(), ?)", [bizId, contactId, socialAccountId]);
            convId = result.insertId;
          } else {
            convId = convos[0].id;
            await pool.query('UPDATE conversations SET last_message_at=NOW(), social_account_id=COALESCE(social_account_id, ?) WHERE id=?', [socialAccountId, convId]);
          }

          // Save inbound message
          const [msgResult] = await pool.query("INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'inbound', ?, 'text')", [convId, text]);
          
          if (io) {
            const [fullMsg] = await pool.query('SELECT * FROM messages WHERE id = ?', [msgResult.insertId]);
            io.to(`biz_${bizId}`).emit('new_message', { 
              conversationId: convId, 
              channel: 'facebook',
              message: fullMsg[0] 
            });
            io.to(`biz_${bizId}`).emit('conversation_update', { bizId });
          }

          // 4. Auto-reply via chatbot
          const [convDetails] = await pool.query('SELECT assigned_to FROM conversations WHERE id=?', [convId]);
          const isAssigned = convDetails.length && convDetails[0].assigned_to;
          
          if (!isAssigned) {
            const [sessionRows] = await pool.query('SELECT * FROM chatbot_sessions WHERE contact_id=? ORDER BY started_at DESC LIMIT 1', [contactId]);
            let session = sessionRows[0] || null;
            
            const [bots] = await pool.query("SELECT * FROM chatbots WHERE business_id=? AND is_active=1 AND channel='facebook'", [bizId]);
            let botTriggered = false;

            for (const bot of bots) {
              const keywords = bot.trigger_keywords || [];
              const isSessionActive = session && session.chatbot_id === bot.id;
              const isKeywordMatch = keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));

              // If keyword matched and session is active, reset session to start fresh
              if (isKeywordMatch && isSessionActive) {
                await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
                session = null;
              }
              
              if (isSessionActive || isKeywordMatch) {
                const result = await processChatbotFlow(bot, contactId, text, { businessId: bizId, socialAccountId });
                console.log('[Facebook Bot] Flow result:', JSON.stringify(result));
                await sendFacebookBotReply(senderId, result, bizId, convId, socialAccountId);
                botTriggered = true;
                break; 
              }
            }

            // Fallback for welcome bot
            if (!botTriggered) {
              const welcomeBot = bots.find(b =>
                (b.name.toLowerCase().includes('welcome') || b.name.toLowerCase().includes('main menu')) ||
                (b.ai_enabled && (!b.trigger_keywords || b.trigger_keywords.length === 0 || b.trigger_keywords.includes('*')))
              );
              if (welcomeBot) {
                const result = await processChatbotFlow(welcomeBot, contactId, text, { businessId: bizId, socialAccountId });
                await sendFacebookBotReply(senderId, result, bizId, convId, socialAccountId);
              }
            }
          }
        } catch (eventError) {
          console.error('❌ Facebook event error:', eventError);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Facebook webhook error:', err);
    res.sendStatus(200);
  }
}

async function sendFacebookBotReply(recipientId, flowResult, businessId, conversationId, socialAccountId = null) {
  const FacebookService = require('../services/FacebookService');
  const { response, interactive } = flowResult;
  if (!response) return;

  try {
    let finalMessage = response;
    // Facebook Messenger supports standard buttons, but for consistency and compatibility,
    // we can format list buttons in plain text if any:
    if (interactive && interactive.action?.buttons) {
      finalMessage += '\n\n';
      interactive.action.buttons.forEach((btn, i) => {
        finalMessage += `${i + 1}. ${btn.reply.title}\n`;
      });
    }

    const res = await FacebookService.sendTextMessage(recipientId, finalMessage, { businessId, socialAccountId });
    if (res.success) {
      await pool.query(
        'INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, ?, ?, ?)',
        [conversationId, 'outbound', finalMessage, 'text']
      );
    }
  } catch (err) {
    console.error('[Facebook Bot] Send failed:', err.message);
  }
}

module.exports = { handleFacebookWebhook };
