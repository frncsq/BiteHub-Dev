import { pool } from './db.js';

async function alterLogo() {
    try {
        console.log("Altering restaurant_logo_url type to TEXT...");
        await pool.query("ALTER TABLE restaurants ALTER COLUMN restaurant_logo_url TYPE TEXT");
        console.log("restaurant_logo_url successfully changed to TEXT.");
    } catch (e) {
        console.error("Error altering type:", e.message);
    } finally {
        process.exit(0);
    }
}

alterLogo();
