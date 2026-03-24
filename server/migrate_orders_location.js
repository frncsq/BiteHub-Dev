const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/bitehub'
});

async function migrate() {
  try {
    console.log('Adding delivery_building and delivery_room to orders table...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_building VARCHAR(255)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_room VARCHAR(255)');
    console.log('Successfully updated orders table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
