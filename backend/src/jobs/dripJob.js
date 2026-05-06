const cron = require('node-cron');
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

// Every 5 minutes: process drip enrollment steps
function startDripJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const [enrollments] = await pool.query(
        "SELECT de.*, dc.steps, dc.business_id, c.phone FROM drip_enrollments de " +
        "JOIN drip_campaigns dc ON de.campaign_id=dc.id " +
        "JOIN contacts c ON de.contact_id=c.id " +
        "WHERE de.status='active' AND de.next_send_at <= NOW() AND dc.is_active=1"
      );

      for (const enrollment of enrollments) {
        const steps = enrollment.steps || [];
        const currentStep = enrollment.current_step;
        if (currentStep >= steps.length) {
          await pool.query("UPDATE drip_enrollments SET status='completed' WHERE id=?", [enrollment.id]);
          continue;
        }

        const step = steps[currentStep];
        // Send message
        if (step.template_id) {
          const [templates] = await pool.query('SELECT name FROM templates WHERE id=?', [step.template_id]);
          if (templates.length) {
            await WhatsappService.sendTemplateMessage(enrollment.phone, templates[0].name, 'en', [], enrollment.business_id);
          }
        } else if (step.message) {
          await WhatsappService.sendTextMessage(enrollment.phone, step.message, enrollment.business_id);
        }

        // Advance step
        const nextStep = currentStep + 1;
        if (nextStep >= steps.length) {
          await pool.query("UPDATE drip_enrollments SET status='completed', current_step=? WHERE id=?", [nextStep, enrollment.id]);
        } else {
          const nextDelay = steps[nextStep].delay_hours || 24;
          const nextSend = new Date(Date.now() + nextDelay * 3600000);
          await pool.query("UPDATE drip_enrollments SET current_step=?, next_send_at=? WHERE id=?", [nextStep, nextSend, enrollment.id]);
        }
      }
    } catch (err) { console.error('Drip job error:', err.message); }
  });
  console.log('💧 Drip campaign scheduler started');
}

module.exports = { startDripJob };
