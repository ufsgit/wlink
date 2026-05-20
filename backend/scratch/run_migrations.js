const { runMigrations } = require('../src/db/migrate');

async function main() {
  console.log('Running migrations...');
  try {
    await runMigrations();
    console.log('Migrations executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
