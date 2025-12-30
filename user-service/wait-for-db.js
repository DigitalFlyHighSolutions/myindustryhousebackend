const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const MAX_RETRIES = 20;
const DELAY = 3000;

(async function waitForDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = new Client({ connectionString: DATABASE_URL });
      await client.connect();
      await client.end();

      console.log('✅ User DB is ready');
      process.exit(0);
    } catch (err) {
      console.log(
        `⏳ Waiting for User DB (${attempt}/${MAX_RETRIES}) → ${err.message}`
      );
      await new Promise((res) => setTimeout(res, DELAY));
    }
  }

  console.error('❌ User DB not reachable after retries');
  process.exit(1);
})();
