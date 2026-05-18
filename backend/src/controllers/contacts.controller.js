const pool = require('../db/pool');
const { parseCSV, buildCSV } = require('../utils/csvParser');
const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(10000, parseInt(limit) || 1000);
  return { offset: (p - 1) * l, limit: l, page: p };
};

const getContacts = async (req, res) => {
  try {
    const { page, limit, tags, channel, search } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;

    let where = 'WHERE business_id = ?';
    const params = [bizId];
    if (channel) { where += ' AND channel_preference = ?'; params.push(channel); }
    if (search) { where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (tags) { where += ' AND JSON_CONTAINS(tags, ?)'; params.push(JSON.stringify(tags)); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM contacts ${where}`, params);
    const [rows] = await pool.query(`SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, lim, offset]);

    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getContact = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createContact = async (req, res) => {
  try {
    const { name, phone, email, tags, channel_preference } = req.body;
    const bizId = req.user.businessId;
    const [result] = await pool.query(
      'INSERT INTO contacts (business_id, name, phone, email, tags, channel_preference) VALUES (?, ?, ?, ?, ?, ?)',
      [bizId, name, phone, email || null, JSON.stringify(tags || []), channel_preference || 'whatsapp']
    );
    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Contact created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateContact = async (req, res) => {
  try {
    const { name, phone, email, tags, channel_preference } = req.body;
    await pool.query(
      'UPDATE contacts SET name=?, phone=?, email=?, tags=?, channel_preference=? WHERE id=? AND business_id=?',
      [name, phone, email || null, JSON.stringify(tags || []), channel_preference || 'whatsapp', req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteContact = async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const importContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    const rows = await parseCSV(req.file.path);
    const bizId = req.user.businessId;
    let imported = 0;
    for (const row of rows) {
      const name = row.name || row.Name || '';
      const phone = row.phone || row.Phone || '';
      const email = row.email || row.Email || '';
      const tags = row.tags ? JSON.stringify(row.tags.split('|').map(t => t.trim())) : '[]';
      if (!phone) continue;
      await pool.query(
        'INSERT INTO contacts (business_id, name, phone, email, tags, opt_in_source) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [bizId, name, phone, email, tags, 'import']
      );
      imported++;
    }
    fs.unlinkSync(req.file.path);
    res.json({ success: true, data: { imported }, message: `${imported} contacts imported` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const exportContacts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name, phone, email, opted_in, channel_preference, created_at FROM contacts WHERE business_id = ?', [req.user.businessId]);
    const csv = buildCSV(rows, ['name', 'phone', 'email', 'opted_in', 'channel_preference', 'created_at']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const optIn = async (req, res) => {
  try {
    const { source } = req.body;
    await pool.query(
      'UPDATE contacts SET opted_in=1, opt_in_date=NOW(), opt_in_source=? WHERE id=? AND business_id=?',
      [source || 'manual', req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Opted in' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const optOut = async (req, res) => {
  try {
    await pool.query(
      'UPDATE contacts SET opted_in=0, opt_out_date=NOW() WHERE id=? AND business_id=?',
      [req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Opted out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createOptInLink = async (req, res) => {
  try {
    const { redirectUrl } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    await pool.query(
      'INSERT INTO opt_in_links (business_id, token, redirect_url) VALUES (?, ?, ?)',
      [req.user.businessId, token, redirectUrl || '']
    );
    const link = `${process.env.BASE_URL}/optin/${token}`;
    res.json({ success: true, data: { token, link }, message: 'Opt-in link created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const handleOptInLink = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opt_in_links WHERE token = ?', [req.params.token]);
    if (!rows.length) return res.status(404).send('Invalid link');
    const link = rows[0];
    const phone = req.query.phone;
    if (phone) {
      const [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [link.business_id, phone]);
      if (contacts.length) {
        await pool.query('UPDATE contacts SET opted_in=1, opt_in_date=NOW(), opt_in_source=? WHERE id=?', ['link', contacts[0].id]);
      } else {
        await pool.query('INSERT INTO contacts (business_id, phone, opted_in, opt_in_date, opt_in_source) VALUES (?, ?, 1, NOW(), ?)', [link.business_id, phone, 'link']);
      }
    }
    if (link.redirect_url) return res.redirect(link.redirect_url);
    res.send('<html><body><h2>✅ You have successfully opted in!</h2></body></html>');
  } catch (err) {
    res.status(500).send('Error processing opt-in');
  }
};

const getUniqueTags = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    console.log(`[DEBUG] Fetching unique tags for Biz ID: ${bizId}`);
    const [rows] = await pool.query('SELECT tags FROM contacts WHERE business_id = ? AND opted_in = 1', [bizId]);
    console.log(`[DEBUG] Found ${rows.length} contacts with tags`);
    const tags = new Set();
    rows.forEach(r => {
      let ct = r.tags;
      if (typeof ct === 'string') {
        try { ct = JSON.parse(ct); } catch (e) { ct = []; }
      }
      if (Array.isArray(ct)) {
        ct.forEach(t => tags.add(t));
      }
    });
    console.log(`[DEBUG] Unique tags found: ${Array.from(tags).join(', ')}`);
    res.json({ success: true, data: Array.from(tags), message: 'OK' });
  } catch (err) {
    console.error(`[DEBUG] getUniqueTags Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact, importContacts, exportContacts, optIn, optOut, createOptInLink, handleOptInLink, getUniqueTags };
