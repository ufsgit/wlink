
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(200,+l||50)), limit: Math.min(200,+l||50), page: Math.max(1,+p||1) });

const getBroadcasts = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;
    let where = 'WHERE b.business_id = ?'; const params = [bizId];
    if (status) { where += ' AND b.status = ?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM broadcasts b ${where}`, params);
    const [rows] = await pool.query(
      `SELECT b.*, t.name as template_name FROM broadcasts b LEFT JOIN templates t ON b.template_id=t.id ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createBroadcast = async (req, res) => {
  try {
    const { name, template_id, target_tags, target_contact_ids, scheduled_at } = req.body;
    const [result] = await pool.query(
      'INSERT INTO broadcasts (business_id, template_id, name, target_tags, target_contact_ids, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, template_id, name, JSON.stringify(target_tags||[]), JSON.stringify(target_contact_ids||[]), scheduled_at||null, scheduled_at?'scheduled':'draft']
    );
    const [rows] = await pool.query('SELECT * FROM broadcasts WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Broadcast created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const sendBroadcast = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT b.*, t.name as tname, t.body as tbody FROM broadcasts b JOIN templates t ON b.template_id=t.id WHERE b.id=? AND b.business_id=?',
      [req.params.id, req.user.businessId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const broadcast = rows[0];

    // Resolve contacts
    let contacts = [];
    const tags = broadcast.target_tags || [];
    const contactIds = broadcast.target_contact_ids || [];
    if (tags.length > 0) {
      const [tagged] = await pool.query('SELECT id, phone FROM contacts WHERE business_id=? AND opted_in=1', [broadcast.business_id]);
      const filtered = tagged.filter(c => {
        const ct = c.tags || [];
        return tags.some(t => ct.includes(t));
      });
      contacts.push(...filtered);
    }
    if (contactIds.length > 0) {
      const [ids] = await pool.query('SELECT id, phone FROM contacts WHERE id IN (?) AND opted_in=1', [contactIds]);
      contacts.push(...ids);
    }
    // Deduplicate
    const seen = new Set();
    contacts = contacts.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

    await pool.query("UPDATE broadcasts SET status='running', started_at=NOW(), total_recipients=? WHERE id=?", [contacts.length, broadcast.id]);

    let sent = 0, failed = 0;
    for (const contact of contacts) {
      const result = await WhatsappService.sendTemplateMessage(contact.phone, broadcast.tname, 'en', [], broadcast.business_id);
      const status = result.success ? 'sent' : 'failed';
      if (result.success) sent++; else failed++;
      await pool.query(
        'INSERT INTO broadcast_logs (broadcast_id, contact_id, status, wa_message_id) VALUES (?, ?, ?, ?)',
        [broadcast.id, contact.id, status, result.data?.messages?.[0]?.id || null]
      );
    }
    await pool.query(
      "UPDATE broadcasts SET status='completed', completed_at=NOW(), total_sent=?, total_failed=? WHERE id=?",
      [sent, failed, broadcast.id]
    );
    res.json({ success: true, data: { sent, failed, total: contacts.length }, message: 'Broadcast sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getBroadcastAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM broadcasts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const [logs] = await pool.query(
      'SELECT bl.*, c.name, c.phone FROM broadcast_logs bl JOIN contacts c ON bl.contact_id=c.id WHERE bl.broadcast_id=?',
      [req.params.id]
    );
    res.json({ success: true, data: { broadcast: rows[0], logs }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteBroadcast = async (req, res) => {
  try {
    await pool.query('DELETE FROM broadcasts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getBroadcasts, createBroadcast, sendBroadcast, getBroadcastAnalytics, deleteBroadcast };
