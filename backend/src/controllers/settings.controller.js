const pool = require('../db/pool');
const bcrypt = require('bcrypt');

const getBusiness = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id=?', [req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    
    const business = rows[0];
    if (!business.fb_verify_token) {
      business.fb_verify_token = 'urban_verify_token_' + req.user.businessId;
    }
    
    res.json({ success: true, data: business, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateBusiness = async (req, res) => {
  try {
    const { name, whatsapp_number, whatsapp_token, whatsapp_phone_id, fb_page_id, ig_account_id, fb_verify_token } = req.body;
    await pool.query(
      'UPDATE businesses SET name=?,whatsapp_number=?,whatsapp_token=?,whatsapp_phone_id=?,fb_page_id=?,ig_account_id=?,fb_verify_token=? WHERE id=?',
      [name, whatsapp_number||'', whatsapp_token||null, whatsapp_phone_id||null, fb_page_id||null, ig_account_id||null, fb_verify_token||null, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id=?', [req.user.businessId]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getTeam = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE business_id=? ORDER BY created_at ASC',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const inviteAgent = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already in use', data: null });
    const hash = await bcrypt.hash(password || 'WLink@123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [req.user.businessId, name, email, hash, role || 'agent']
    );
    const [rows] = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Agent invited' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateAgent = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    await pool.query('UPDATE users SET role=?,is_active=? WHERE id=? AND business_id=?', [role, is_active, req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteAgent = async (req, res) => {
  try {
    if (req.params.id == req.user.userId) return res.status(400).json({ success: false, message: 'Cannot delete yourself', data: null });
    await pool.query('DELETE FROM users WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getBilling = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT plan, green_tick_status FROM businesses WHERE id=?', [req.user.businessId]);
    const plans = {
      starter: { price: 999, contacts: 1000, broadcasts: 5, agents: 1 },
      pro: { price: 2999, contacts: 10000, broadcasts: 50, agents: 5 },
      enterprise: { price: 9999, contacts: 100000, broadcasts: 500, agents: 25 }
    };
    res.json({ success: true, data: { ...rows[0], plans }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const testWhatsAppConnection = async (req, res) => {
  try {
    const WhatsappService = require('../services/WhatsappService');
    const result = await WhatsappService.testConnection(req.user.businessId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getBusiness, updateBusiness, getTeam, inviteAgent, updateAgent, deleteAgent, getBilling, testWhatsAppConnection };
