const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(200, parseInt(limit) || 50);
  return { offset: (p - 1) * l, limit: l, page: p };
};

const getConversations = async (req, res) => {
  try {
    const { page, limit, status, channel, assigned_to } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;

    let where = 'WHERE c.business_id = ?';
    const params = [bizId];
    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (channel) { where += ' AND c.channel = ?'; params.push(channel); }
    if (assigned_to === 'me') { where += ' AND c.assigned_to = ?'; params.push(req.user.userId); }
    else if (assigned_to) { where += ' AND c.assigned_to = ?'; params.push(assigned_to); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM conversations c ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT c.*, co.name as contact_name, co.phone as contact_phone,
        u.name as assigned_name,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.direction = 'inbound') as unread_count
       FROM conversations c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.assigned_to = u.id
       ${where} ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?', [req.params.id]);
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC LIMIT ? OFFSET ?',
      [req.params.id, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, message_type, media_url } = req.body;
    const convId = req.params.id;

    const [convRows] = await pool.query(
      'SELECT c.*, co.phone FROM conversations c JOIN contacts co ON c.contact_id = co.id WHERE c.id = ?',
      [convId]
    );
    if (!convRows.length) return res.status(404).json({ success: false, message: 'Conversation not found', data: null });
    const conv = convRows[0];

    let waResult;
    if (message_type === 'text' || !message_type) {
      waResult = await WhatsappService.sendTextMessage(conv.phone, content, req.user.businessId);
    } else {
      waResult = await WhatsappService.sendMediaMessage(conv.phone, message_type, media_url, content, req.user.businessId);
    }

    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, direction, content, media_url, message_type, wa_message_id) VALUES (?, ?, ?, ?, ?, ?)',
      [convId, 'outbound', content, media_url || null, message_type || 'text', waResult.data?.messages?.[0]?.id || null]
    );
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

    const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${conv.business_id}`).emit('new_message', { conversationId: convId, message: msg[0] });
    }

    res.json({ success: true, data: msg[0], message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const assignConversation = async (req, res) => {
  try {
    const { agent_id } = req.body;
    await pool.query('UPDATE conversations SET assigned_to = ? WHERE id = ? AND business_id = ?', [agent_id, req.params.id, req.user.businessId]);
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${req.user.businessId}`).emit('conversation_updated', { conversationId: req.params.id, assigned_to: agent_id });
    }
    res.json({ success: true, data: null, message: 'Assigned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE conversations SET status = ? WHERE id = ? AND business_id = ?', [status, req.params.id, req.user.businessId]);
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${req.user.businessId}`).emit('conversation_updated', { conversationId: req.params.id, status });
    }
    res.json({ success: true, data: null, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createConversation = async (req, res) => {
  try {
    const { contact_id, channel } = req.body;
    const bizId = req.user.businessId;
    const [existing] = await pool.query(
      "SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status='open'",
      [bizId, contact_id]
    );
    if (existing.length) return res.json({ success: true, data: existing[0], message: 'Existing conversation' });

    const [result] = await pool.query(
      'INSERT INTO conversations (business_id, contact_id, channel) VALUES (?, ?, ?)',
      [bizId, contact_id, channel || 'whatsapp']
    );
    const [rows] = await pool.query('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getConversations, getMessages, sendMessage, assignConversation, updateStatus, createConversation };
