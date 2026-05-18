const cron = require('node-cron');
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

// Every minute: check scheduled broadcasts
function startBroadcastJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM broadcasts WHERE status='scheduled' AND scheduled_at <= NOW()"
      );
      for (const broadcast of rows) {
        await pool.query("UPDATE broadcasts SET status='running', started_at=NOW() WHERE id=?", [broadcast.id]);

        const tags = broadcast.target_tags || [];
        const contactIds = broadcast.target_contact_ids || [];
        let contacts = [];
        if (tags.length) {
          const [all] = await pool.query('SELECT id, phone, tags FROM contacts WHERE business_id=? AND opted_in=1', [broadcast.business_id]);
          contacts.push(...all.filter(c => (c.tags || []).some(t => tags.includes(t))));
        }
        if (contactIds.length) {
          const [ids] = await pool.query('SELECT id, phone FROM contacts WHERE id IN (?) AND opted_in=1', [contactIds]);
          contacts.push(...ids);
        }
        const seen = new Set();
        contacts = contacts.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

        const [templates] = await pool.query('SELECT name FROM templates WHERE id=?', [broadcast.template_id]);
        const tName = templates[0]?.name;
        await pool.query('UPDATE broadcasts SET total_recipients=? WHERE id=?', [contacts.length, broadcast.id]);

        let sent = 0, failed = 0;
        for (const contact of contacts) {
          const result = await WhatsappService.sendTemplateMessage(contact.phone, tName, 'en', broadcast.business_id);
          const status = result.success ? 'sent' : 'failed';
          if (result.success) sent++; else failed++;
          await pool.query(
            'INSERT INTO broadcast_logs (broadcast_id, contact_id, status, wa_message_id) VALUES (?, ?, ?, ?)',
            [broadcast.id, contact.id, status, result.data?.messages?.[0]?.id || null]
          );
        }
        await pool.query("UPDATE broadcasts SET status='completed', completed_at=NOW(), total_sent=?, total_failed=? WHERE id=?", [sent, failed, broadcast.id]);
      }
    } catch (err) { console.error('Broadcast job error:', err.message); }
  });
  console.log('📡 Broadcast scheduler started');
}
module.exports = { startBroadcastJob };
