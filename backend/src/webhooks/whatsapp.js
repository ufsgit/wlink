const pool = require('../db/pool');
const { processChatbotFlow } = require('../controllers/chatbots.controller');

async function handleWhatsappWebhook(req, res, io) {
  console.log('--- Incoming Webhook Request ---');
  console.log('Method:', req.method);
  console.log('Headers Content-Type:', req.headers['content-type']);
  console.log('Body Type:', typeof req.body);
  console.log('Body exists:', !!req.body);
  
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
          const text = msg.text?.body || msg.caption || '';
          const msgType = msg.type || 'text';

          // Find business by phone_id (with fallback for Meta test ID)
          let [businesses] = await pool.query('SELECT id FROM businesses WHERE whatsapp_phone_id=?', [phoneId]);
          
          if (!businesses.length && phoneId === '123456123') {
            console.log('--- Using fallback for Meta Test ID (123456123) ---');
            [businesses] = await pool.query('SELECT id FROM businesses LIMIT 1');
          }

          console.log(`Matching business for ${phoneId}:`, businesses.length ? `Found ID ${businesses[0].id}` : 'NOT FOUND');
          
          if (!businesses.length) continue;
          const bizId = businesses[0].id;

          // Find or create contact
          let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, from]);
          let contactId;
          if (!contacts.length) {
            const [result] = await pool.query("INSERT INTO contacts (business_id, phone, opted_in, opt_in_source) VALUES (?, ?, 1, 'whatsapp')", [bizId, from]);
            contactId = result.insertId;
          } else {
            contactId = contacts[0].id;
          }

          // Find or create conversation
          let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status!='resolved' LIMIT 1", [bizId, contactId]);
          let convId;
          if (!convos.length) {
            const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'whatsapp', NOW())", [bizId, contactId]);
            convId = result.insertId;
          } else {
            convId = convos[0].id;
            await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);
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
          const [bots] = await pool.query("SELECT * FROM chatbots WHERE business_id=? AND is_active=1 AND channel='whatsapp'", [bizId]);
          for (const bot of bots) {
            const keywords = bot.trigger_keywords || [];
            if (keywords.some(k => text.toLowerCase().includes(k.toLowerCase()))) {
              const result = await processChatbotFlow(bot, contactId, text, bizId);
              if (result.response) {
                const WhatsappService = require('../services/WhatsappService');
                await WhatsappService.sendTextMessage(from, result.response, bizId);
                await pool.query(
                  "INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')",
                  [convId, result.response]
                );
              }
              break;
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
