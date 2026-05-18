const pool = require('../db/pool');
const { processChatbotFlow } = require('../controllers/chatbots.controller');

async function handleFacebookWebhook(req, res, io) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  try {
    const body = req.body;
    console.log('📬 Incoming Facebook Webhook:', JSON.stringify(body, null, 2));
    const entries = body.entry || [];
    for (const entry of entries) {
      const pageId = entry.id;
      const [businesses] = await pool.query('SELECT id FROM businesses WHERE fb_page_id=?', [pageId]);
      if (!businesses.length) continue;
      const bizId = businesses[0].id;
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const senderId = event.sender?.id;
        const text = event.message?.text || '';
        console.log(`📡 FB Event: Sender=${senderId}, Text=${text}`);
        if (!senderId || !text) continue;

        let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, senderId]);
        let contactId;
        if (!contacts.length) {
          const [result] = await pool.query('INSERT INTO contacts (business_id, phone, name) VALUES (?, ?, ?)', [bizId, senderId, `FB_${senderId}`]);
          contactId = result.insertId;
        } else contactId = contacts[0].id;

        let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND channel='facebook' AND status!='resolved' LIMIT 1", [bizId, contactId]);
        let convId;
        if (!convos.length) {
          const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'facebook', NOW())", [bizId, contactId]);
          convId = result.insertId;
        } else {
          convId = convos[0].id;
          await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);
        }
        await pool.query("INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'inbound', ?, 'text')", [convId, text]);
        if (io) io.to(`biz_${bizId}`).emit('new_message', { conversationId: convId });

        // Auto-reply via chatbot
        const [bots] = await pool.query("SELECT * FROM chatbots WHERE business_id=? AND is_active=1 AND channel='facebook'", [bizId]);
        for (const bot of bots) {
          const kws = bot.trigger_keywords || [];
          if (kws.some(k => text.toLowerCase().includes(k.toLowerCase()))) {
            await processChatbotFlow(bot, contactId, text, bizId);
            break;
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Facebook webhook error:', err);
    res.sendStatus(200);
  }
}

module.exports = { handleFacebookWebhook };
