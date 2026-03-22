import 'dotenv/config';
import { pool } from './db.js';

const run = async () => {
    try {
        // Approve all restaurants that existed before the approval system was introduced.
        // NEW registrations will correctly start as 'pending' going forward.
        const result = await pool.query(
            "UPDATE restaurants SET approval_status='approved', is_verified=true WHERE approval_status='pending' OR approval_status IS NULL"
        );
        console.log(`✅ Approved ${result.rowCount} existing restaurant(s).`);

        // Show current state
        const rows = await pool.query('SELECT id, username, approval_status FROM restaurants ORDER BY id');
        rows.rows.forEach(r => console.log(`   [${r.id}] ${r.username} → ${r.approval_status}`));
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit(0);
};

run();
