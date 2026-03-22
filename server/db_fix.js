import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixDB() {
  try {
    console.log('Connecting to BiteHub database...');
    // Drop tax_id column
    await pool.query('ALTER TABLE restaurants DROP COLUMN IF EXISTS tax_id;');
    console.log('✅ Dropped tax_id column successfully.');
  } catch (error) {
    console.error('Error modifying schema:', error);
  } finally {
    pool.end();
  }
}

fixDB();
