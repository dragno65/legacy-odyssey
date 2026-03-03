#!/usr/bin/env node
/**
 * Drop the UNIQUE constraint on families.auth_user_id
 * to allow one user to own multiple families (websites).
 * Also drops the UNIQUE index on books(family_id) for multi-book per family.
 */
require('dotenv').config();
const { Client } = require('pg');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'vesaydfwwdbbajydbzmq';

// Try multiple connection methods
const configs = [
  {
    name: 'pooler-transaction-us-west-1',
    connectionString: `postgresql://postgres.${PROJECT_REF}:${SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'pooler-session-us-west-1',
    connectionString: `postgresql://postgres.${PROJECT_REF}:${SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'pooler-transaction-us-east-1',
    connectionString: `postgresql://postgres.${PROJECT_REF}:${SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'direct',
    connectionString: `postgresql://postgres:${SERVICE_KEY}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  },
];

async function main() {
  for (const config of configs) {
    console.log(`Trying ${config.name}...`);
    const client = new Client({
      connectionString: config.connectionString,
      ssl: config.ssl,
      connectionTimeoutMillis: 10000,
    });
    try {
      await client.connect();
      console.log(`${config.name} — CONNECTED!`);

      // Drop the unique constraint on auth_user_id
      await client.query('ALTER TABLE families DROP CONSTRAINT IF EXISTS families_auth_user_id_key;');
      console.log('Dropped UNIQUE constraint on families.auth_user_id');

      // Drop the unique index on books(family_id) to allow multiple books per family
      await client.query('DROP INDEX IF EXISTS idx_books_family;');
      console.log('Dropped UNIQUE INDEX idx_books_family');

      // Add a non-unique index for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_families_auth_user ON families(auth_user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_books_family_id ON books(family_id);');
      console.log('Created non-unique indexes');

      // Also add visible_sections column while we have a connection
      await client.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS visible_sections JSONB DEFAULT '{}'::jsonb;");
      console.log('Added visible_sections column to books');

      await client.end();
      console.log('\nDone! Database updated successfully.');
      process.exit(0);
    } catch (err) {
      console.log(`${config.name} — FAILED: ${err.message}`);
      try { await client.end(); } catch (e) { /* ignore */ }
    }
  }
  console.log('\nAll connection methods failed. You may need to run this SQL in the Supabase Dashboard SQL Editor:');
  console.log(`
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_auth_user_id_key;
DROP INDEX IF EXISTS idx_books_family;
CREATE INDEX IF NOT EXISTS idx_families_auth_user ON families(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_books_family_id ON books(family_id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS visible_sections JSONB DEFAULT '{}'::jsonb;
  `);
  process.exit(1);
}

main();
