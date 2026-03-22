import { pool } from './db.js';
import { hashPassword } from './components/hash.js';
import dotenv from 'dotenv';
dotenv.config();

async function updateSchemaAdmin() {
    try {
        console.log("Creating admin_role_enum and admins table...");
        
        // Add roles enum
        try {
            await pool.query("CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'support_staff')");
        } catch (e) {
            console.log("admin_role_enum might already exist:", e.message);
        }

        // Create admins table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role admin_role_enum DEFAULT 'support_staff',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add master admin if not exists
        const adminEmail = 'admin@bitehub.com';
        const res = await pool.query('SELECT * FROM admins WHERE email = $1', [adminEmail]);
        
        if (res.rows.length === 0) {
            console.log("Creating default super admin account...");
            const hash = await hashPassword('adminpassword123');
            await pool.query(
                `INSERT INTO admins (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
                ['superadmin', adminEmail, hash, 'super_admin']
            );
            console.log("Super admin account created: admin@bitehub.com / adminpassword123");
        } else {
            console.log("Super admin account already exists.");
        }

        console.log("Admin schema update completed!");
    } catch (e) {
        console.error("Error updating schema:", e.message);
    } finally {
        process.exit(0);
    }
}

updateSchemaAdmin();
