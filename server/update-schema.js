import { pool } from './db.js';

async function updateSchema() {
    try {
        console.log("Adding new ENUM values to order_status_enum...");
        await pool.query("ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'accepted'");
        await pool.query("ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'prepared'");
        await pool.query("ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'out_for_delivery'");
        console.log("Schema ENUMs updated via PSQL!");
    } catch (e) {
        console.error("Error (might already exist):", e.message);
    } finally {
        process.exit(0);
    }
}

updateSchema();
