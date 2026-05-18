const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getTemplates = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;
    console.log(`[DEBUG] Fetching templates for Biz ID: ${bizId}`);
    let where = 'WHERE business_id = ?';
    const params = [bizId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM templates ${where}`, params);
    const [rows] = await pool.query(`SELECT * FROM templates ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, lim, offset]);
    console.log(`[DEBUG] Found ${rows.length} templates`);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { 
    console.error(`[DEBUG] getTemplates Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message, data: null }); 
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, category, language, header_type, header_content, body, footer, buttons } = req.body;
    const [result] = await pool.query(
      'INSERT INTO templates (business_id, name, category, language, header_type, header_content, body, footer, buttons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, category, language||'en', header_type||'none', header_content||null, body, footer||null, JSON.stringify(buttons||[])]
    );
    const [rows] = await pool.query('SELECT * FROM templates WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Template created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, category, language, header_type, header_content, body, footer, buttons } = req.body;
    await pool.query(
      'UPDATE templates SET name=?,category=?,language=?,header_type=?,header_content=?,body=?,footer=?,buttons=? WHERE id=? AND business_id=?',
      [name, category, language||'en', header_type||'none', header_content||null, body, footer||null, JSON.stringify(buttons||[]), req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteTemplate = async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const submitTemplate = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM templates WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const result = await WhatsappService.submitTemplate(rows[0]);
    if (result.success) {
      await pool.query("UPDATE templates SET status='pending', wa_template_id=? WHERE id=?", [result.data?.id || null, req.params.id]);
    }
    res.json({ success: result.success, data: result.data, message: result.message || 'Submitted for approval' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate };
