import 'dotenv/config';
import { pool } from './db.js';

const run = async () => {
  try {
    const res = await pool.query("UPDATE restaurants SET approval_status = 'approved', is_verified = true WHERE username = 'pizzatestuser' OR id = 1");
    console.log(`✅ Approved ${res.rowCount} restaurant(s). You can now log in with 'pizzatestuser'.`);
  } catch (err) {
    console.error('❌ Error approving restaurant:', err.message);
  } finally {
    process.exit(0);
  }
};

run();
