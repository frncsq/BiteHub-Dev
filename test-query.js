import { pool } from './server/db.js';

async function test() {
    try {
        await pool.query('SELECT id, business_name, owner_name, business_email, owner_phone, city, cuisine_type, is_verified, is_open, rating, created_at FROM restaurants ORDER BY created_at DESC');
        console.log('RESTAURANTS QUERY: OK');
    } catch(err) {
        console.error('RESTAURANTS ERROR:', err.message);
    }

    try {
        await pool.query(`
            SELECT o.id, o.total_amount, o.order_status, o.created_at as transaction_date,
                   u.full_name as customer_name,
                   r.business_name as restaurant_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.order_status IN ('delivered', 'ready')
            ORDER BY o.created_at DESC
        `);
        console.log('PAYMENTS QUERY: OK');
    } catch(err) {
        console.error('PAYMENTS ERROR:', err.message);
    }
    
    process.exit(0);
}

test();
