import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function check() {
  const { pool } = await import('./db.js');
  try {
    const res = await pool.query("SELECT item_name, price, half_price, large_price FROM menu_items WHERE item_name ILIKE '%Machito%'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
