const pool = require('../src/db/pool');
const { createBroadcast, sendBroadcast } = require('../src/controllers/broadcasts.controller');

async function testBroadcast() {
  const contactName = "salman";
  const businessId = 4;
  
  // 1. Get contact ID
  const [contacts] = await pool.query('SELECT id, name, phone FROM contacts WHERE name LIKE ? AND business_id=?', [`%${contactName}%`, businessId]);
  if (contacts.length === 0) {
    console.error('Contact not found');
    process.exit(1);
  }
  const contactId = contacts[0].id;
  console.log(`Sending broadcast to: ${contacts[0].name} (ID: ${contactId}, Phone: ${contacts[0].phone})`);

  const [templates] = await pool.query('SELECT id, name FROM templates WHERE name="service" AND business_id=? LIMIT 1', [businessId]);
  if (templates.length === 0) {
    console.error('No approved templates found');
    process.exit(1);
  }
  const templateId = templates[0].id;
  console.log(`Using template: ${templates[0].name} (ID: ${templateId})`);

  // 3. Mock req and res for createBroadcast
  let broadcastId;
  const mockReqCreate = {
    user: { businessId: businessId },
    body: {
      name: `Test Broadcast to ${contactName}`,
      template_id: templateId,
      target_tags: [],
      target_contact_ids: [contactId],
      channel: 'whatsapp'
    }
  };
  const mockResCreate = {
    status: (code) => mockResCreate,
    json: (data) => {
      if (data.success) {
        broadcastId = data.data.id;
        console.log(`Created Broadcast ID: ${broadcastId}`);
      } else {
        console.error('Failed to create broadcast:', data);
        process.exit(1);
      }
    }
  };

  await createBroadcast(mockReqCreate, mockResCreate);

  if (!broadcastId) {
    console.error('Broadcast ID not retrieved');
    process.exit(1);
  }

  // 4. Mock req and res for sendBroadcast
  const mockReqSend = {
    user: { businessId: businessId },
    params: { id: broadcastId },
    app: { get: () => null } // mock io
  };
  const mockResSend = {
    status: (code) => mockResSend,
    json: (data) => {
      console.log('Send Broadcast Result:', data);
      if (data.success) {
        console.log(`Broadcast sent successfully! Sent: ${data.data.sent}, Failed: ${data.data.failed}`);
      }
    }
  };

  await sendBroadcast(mockReqSend, mockResSend);

  // 5. Wait a few seconds to let webhook process any failure statuses
  console.log('Waiting 5 seconds for potential webhook updates...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const [logs] = await pool.query('SELECT bl.*, m.status as msg_status FROM broadcast_logs bl LEFT JOIN messages m ON bl.wa_message_id = m.wa_message_id WHERE bl.broadcast_id=?', [broadcastId]);
  console.log('Broadcast Logs:', logs);

  process.exit(0);
}

testBroadcast().catch(err => {
  console.error(err);
  process.exit(1);
});
