const { syncTemplates } = require('../src/controllers/templates.controller');
const pool = require('../src/db/pool');

async function testSync() {
  const req = { user: { businessId: 4 } };
  const res = {
    json: (data) => {
      console.log('Response JSON:', JSON.stringify(data, null, 2));
    },
    status: (code) => {
      console.log('Response Status:', code);
      return res;
    }
  };

  await syncTemplates(req, res);

  const [rows] = await pool.query('SELECT id, name, status, language FROM templates WHERE business_id = 4');
  console.log('Templates in DB:', rows);
  
  process.exit(0);
}

testSync().catch(err => {
  console.error(err);
  process.exit(1);
});
