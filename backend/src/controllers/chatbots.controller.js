const pool = require('../db/pool');
const OpenAIService = require('../services/OpenAIService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(200,+l||50)), limit: Math.min(200,+l||50), page: Math.max(1,+p||1) });

const getChatbots = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM chatbots WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createChatbot = async (req, res) => {
  try {
    const { name, trigger_keywords, flow, ai_enabled, openai_system_prompt, channel } = req.body;
    const [result] = await pool.query(
      'INSERT INTO chatbots (business_id, name, trigger_keywords, flow, ai_enabled, openai_system_prompt, channel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, JSON.stringify(trigger_keywords||[]), JSON.stringify(flow||{nodes:[],edges:[]}), ai_enabled||0, openai_system_prompt||null, channel||'whatsapp']
    );
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Chatbot created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateChatbot = async (req, res) => {
  try {
    const { name, trigger_keywords, flow, ai_enabled, openai_system_prompt, is_active, channel } = req.body;
    await pool.query(
      'UPDATE chatbots SET name=?,trigger_keywords=?,flow=?,ai_enabled=?,openai_system_prompt=?,is_active=?,channel=? WHERE id=? AND business_id=?',
      [name, JSON.stringify(trigger_keywords||[]), JSON.stringify(flow||{nodes:[],edges:[]}), ai_enabled||0, openai_system_prompt||null, is_active!==undefined?is_active:1, channel||'whatsapp', req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteChatbot = async (req, res) => {
  try {
    await pool.query('DELETE FROM chatbots WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const testChatbot = async (req, res) => {
  try {
    const { message, contact_id } = req.body;
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const result = await processChatbotFlow(rows[0], contact_id || 0, message, req.user.businessId);
    res.json({ success: true, data: result, message: 'Test completed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

async function processChatbotFlow(chatbot, contactId, inboundMessage, businessId) {
  const flow = chatbot.flow || { nodes: [], edges: [] };
  const nodes = flow.nodes || [];

  // Find or create session
  let [sessions] = await pool.query(
    'SELECT * FROM chatbot_sessions WHERE chatbot_id=? AND contact_id=? ORDER BY started_at DESC LIMIT 1',
    [chatbot.id, contactId]
  );
  let session = sessions[0];
  let currentNodeId = session?.current_node_id || (nodes[0]?.id);

  const currentNode = nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return { response: 'Sorry, I could not process your request.' };

  let response = '';
  let nextNodeId = currentNode.next;

  if (currentNode.type === 'message') {
    response = currentNode.content;
  } else if (currentNode.type === 'collect_input') {
    response = currentNode.content;
    nextNodeId = currentNode.next;
  } else if (currentNode.type === 'condition') {
    const rules = currentNode.rules || [];
    const matched = rules.find(r => inboundMessage.trim() === r.match);
    nextNodeId = matched ? matched.next : currentNode.default;
    const nextNode = nodes.find(n => n.id === nextNodeId);
    response = nextNode?.content || 'Processing...';
  } else if (currentNode.type === 'ai_response') {
    const aiResult = await OpenAIService.chat(businessId, [{ role: 'user', content: inboundMessage }], chatbot.openai_system_prompt || '');
    response = aiResult.success ? aiResult.data : 'AI is not available right now.';
  } else if (currentNode.type === 'end') {
    response = currentNode.content || 'Thank you!';
    if (session) await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
    return { response };
  }

  // Upsert session
  if (session) {
    await pool.query('UPDATE chatbot_sessions SET current_node_id=?, last_activity=NOW() WHERE id=?', [nextNodeId || currentNodeId, session.id]);
  } else {
    await pool.query(
      'INSERT INTO chatbot_sessions (chatbot_id, contact_id, current_node_id) VALUES (?, ?, ?)',
      [chatbot.id, contactId, nextNodeId || currentNodeId]
    );
  }
  return { response, currentNode: currentNodeId, nextNode: nextNodeId };
}

module.exports = { getChatbots, createChatbot, updateChatbot, deleteChatbot, testChatbot, processChatbotFlow };
