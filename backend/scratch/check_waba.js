const pool = require('../src/db/pool');
pool.query('SELECT waba_id, account_id, platform FROM social_accounts WHERE business_id=4').then(([rows]) => { console.log(rows); process.exit(0); });
