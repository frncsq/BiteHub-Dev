import 'dotenv/config';
import { pool } from './db.js';

const run = async () => {
    try {
        console.log('🔄 Adding approval_status column to restaurants table...');

        // Add approval_status column if it doesn't exist
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='restaurants' AND column_name='approval_status'
                ) THEN
                    ALTER TABLE restaurants ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'pending';
                    -- Any already-"verified" restaurants are approved, others are pending
                    UPDATE restaurants SET approval_status = CASE WHEN is_verified = true THEN 'approved' ELSE 'pending' END;
                    RAISE NOTICE 'Column approval_status added and backfilled.';
                ELSE
                    RAISE NOTICE 'Column approval_status already exists.';
                END IF;
            END$$;
        `);

        console.log('✅ Schema migration complete. approval_status column is ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
    process.exit(0);
};

run();
