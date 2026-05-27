const pool = require('../db/pool');
const { parseCSV, buildCSV } = require('../utils/csvParser');
const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { normalizePhone } = require('../utils/phoneHelper');

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
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        data: null
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM contacts WHERE business_id = ? AND phone = ?',
      [bizId, normalized]
    );
    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists',
        data: null
      });
    }

    const [result] = await pool.query(
      'INSERT INTO contacts (business_id, name, phone, email, tags, channel_preference) VALUES (?, ?, ?, ?, ?, ?)',
      [bizId, name, normalized || null, email || null, JSON.stringify(tags || []), channel_preference || 'whatsapp']
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
    const bizId = req.user.businessId;

    const [existingContactRow] = await pool.query('SELECT * FROM contacts WHERE id = ? AND business_id = ?', [req.params.id, bizId]);
    if (!existingContactRow.length) {
      return res.status(404).json({ success: false, message: 'Contact not found', data: null });
    }
    const existingContact = existingContactRow[0];

    const newName = name !== undefined ? name : existingContact.name;
    const newEmail = email !== undefined ? email : existingContact.email;
    const newChannel = channel_preference !== undefined ? channel_preference : existingContact.channel_preference;
    
    let newTags = existingContact.tags;
    if (tags !== undefined) {
      newTags = tags; // can be string or array from frontend
    }
    // Ensure tags is a valid JSON string for MySQL
    const finalTags = typeof newTags === 'string' ? newTags : JSON.stringify(newTags || []);

    let normalizedPhone = existingContact.phone;
    if (phone !== undefined) {
      normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required', data: null });
      }

      const [existing] = await pool.query(
        'SELECT id FROM contacts WHERE business_id = ? AND phone = ? AND id != ?',
        [bizId, normalizedPhone, req.params.id]
      );
      if (existing.length) {
        return res.status(400).json({ success: false, message: 'Contact with this phone number already exists', data: null });
      }
    }

    await pool.query(
      'UPDATE contacts SET name=?, phone=?, email=?, tags=?, channel_preference=? WHERE id=? AND business_id=?',
      [newName, normalizedPhone, newEmail, finalTags, newChannel, req.params.id, bizId]
    );
    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteContact = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = req.params.id;
    const bizId = req.user.businessId;

    const [rows] = await conn.query('SELECT id FROM contacts WHERE id = ? AND business_id = ?', [id, bizId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Contact not found', data: null });
    }

    await conn.query('DELETE FROM broadcast_logs WHERE contact_id = ?', [id]);
    await conn.query('DELETE FROM chatbot_sessions WHERE contact_id = ?', [id]);
    await conn.query('DELETE FROM drip_enrollments WHERE contact_id = ?', [id]);
    await conn.query('DELETE FROM orders WHERE contact_id = ?', [id]);

    const [convs] = await conn.query('SELECT id FROM conversations WHERE contact_id = ?', [id]);
    if (convs.length) {
      const convIds = convs.map(c => c.id);
      await conn.query('DELETE FROM messages WHERE conversation_id IN (?)', [convIds]);
      await conn.query('DELETE FROM conversations WHERE contact_id = ?', [id]);
    }

    await conn.query('DELETE FROM contacts WHERE id = ?', [id]);

    await conn.commit();
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    conn.release();
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
      const parsedTags = row.tags ? row.tags.split('|').map(t => t.trim()) : [];
      if (!parsedTags.includes('imported')) {
        parsedTags.push('imported');
      }
      const tags = JSON.stringify(parsedTags);
      if (!phone) continue;

      const normalized = normalizePhone(phone);
      const [existing] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, normalized]);
      if (existing.length) {
        await pool.query(
          'UPDATE contacts SET name=?, email=?, tags=JSON_MERGE_PRESERVE(tags, ?) WHERE id=?',
          [name, email, tags, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO contacts (business_id, name, phone, email, tags, opt_in_source) VALUES (?, ?, ?, ?, ?, ?)',
          [bizId, name, normalized, email, tags, 'import']
        );
      }
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
    const [rows] = await pool.query('SELECT tags FROM contacts WHERE business_id = ?', [bizId]);
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
