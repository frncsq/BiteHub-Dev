import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function migrate() {
  const { pool } = await import('./db.js');
  try {
    await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS large_price NUMERIC(10, 2);');
    console.log('✅ Added large_price column');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
