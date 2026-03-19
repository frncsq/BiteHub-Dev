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
    // Attempt to add column
    await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS half_price NUMERIC(10, 2) DEFAULT NULL;');
    console.log('✅ Added half_price column successfully.');
    
    // Attempt to alter image_url type
    await pool.query('ALTER TABLE menu_items ALTER COLUMN image_url TYPE TEXT;');
    console.log('✅ Altered image_url to TEXT successfully.');
  } catch (error) {
    console.error('Error modifying schema:', error);
  } finally {
    pool.end();
  }
}

fixDB();
