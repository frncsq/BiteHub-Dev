import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { comparePassword, hashPassword } from '../components/hash.js';
import { rotateFlashSale } from '../components/flashSale.js';

const router = express.Router();

// Middleware to check admin session or token
const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-123');
            req.userId = decoded.id;
            req.user = decoded;
            if (req.session) {
                req.session.adminId = decoded.id;
                req.session.adminRole = decoded.role;
            }
            return next();
        } catch (err) {
            console.error("[ADMIN AUTH] ❌ Token invalid:", err.message);
        }
    }

    // Fallback to session
    const adminId = req.session.adminId;
    if (!adminId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access. Admin token or session required.' });
    }
    next();
};

const isSuperAdmin = (req, res, next) => {
    const adminId = req.userId || req.session.adminId;
    const adminRole = req.user?.role || req.session.adminRole;
    if (!adminId || adminRole !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden. Super admin privileges required.' });
    }
    next();
};

// ============================================
// Auth & Roles
// ============================================

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

    try {
        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!admin.is_active) {
            return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
        }

        const valid = await comparePassword(password, admin.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
        req.session.adminRole = admin.role;
        req.session.adminUser = { id: admin.id, username: admin.username, email: admin.email, role: admin.role };

        // Issue JWT token for admin
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
            process.env.JWT_SECRET || 'super-secret-key-123',
            { expiresIn: '7d' }
        );

        console.log(`[ADMIN LOGIN] Token generated for ${admin.email}`);
        res.json({ success: true, user: req.session.adminUser, token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', isAdmin, async (req, res) => {
    try {
        const adminId = req.userId || req.session.adminId;
        const result = await pool.query('SELECT id, username, email, role FROM admins WHERE id = $1', [adminId]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Admin not found.' });
        }
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error("[ADMIN ME] Error:", err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// Dashboard Analytics
// ============================================

router.get('/analytics', isAdmin, async (req, res) => {
    try {
        const usersCount = await pool.query("SELECT COUNT(*) FROM users");
        const restaurantsCount = await pool.query("SELECT COUNT(*) FROM restaurants");
        const ordersCount = await pool.query("SELECT COUNT(*) FROM orders");
        
        const totalRevenue = await pool.query("SELECT SUM(total_amount) FROM orders WHERE order_status IN ('delivered', 'ready')");
        
        // Let's get "daily" growth approx for last 30 days
        const growthResult = await pool.query(`
            SELECT DATE(created_at) as date, SUM(total_amount) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '30 days'
              AND (order_status IN ('delivered', 'ready'))
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            analytics: {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalRestaurants: parseInt(restaurantsCount.rows[0].count),
                totalOrders: parseInt(ordersCount.rows[0].count),
                totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
                revenueTrend: growthResult.rows.map(r => ({ date: r.date, revenue: parseFloat(r.revenue) }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// Users Management
// ============================================

router.get('/users', isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, full_name, email, phone, role, is_active, department, course, year, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        // user role column: we'll simulate 'customer' if there is no role.
        try {
            const fallbackResult = await pool.query('SELECT id, full_name, email, phone, is_active, department, course, year, created_at FROM users ORDER BY created_at DESC');
            res.json({ success: true, users: fallbackResult.rows.map(u => ({...u, role: 'customer'})) });
        } catch (innerError) {
             res.status(500).json({ success: false, message: innerError.message });
        }
    }
});

router.patch('/users/:id/status', isAdmin, async (req, res) => {
    const { is_active } = req.body;
    try {
        await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, req.params.id]);
        res.json({ success: true, message: `User status updated to ${is_active ? 'active' : 'suspended'}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/users/:id/reset-password', isSuperAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, message: 'newPassword is required' });
    try {
        const hashed = await hashPassword(newPassword);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.params.id]);
        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// Restaurant / Vendor Management
// ============================================

router.get('/restaurants', isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, business_name, owner_name, business_email, owner_phone, city, cuisine_type, is_verified, is_open, is_active, rating, approval_status, created_at FROM restaurants ORDER BY created_at DESC');
        
        // Add performance data
        const restaurants = result.rows;
        for (let r of restaurants) {
            const perf = await pool.query(`
                SELECT COUNT(*) as total_orders, SUM(total_amount) as revenue
                FROM orders WHERE restaurant_id = $1 AND order_status IN ('delivered', 'ready')
            `, [r.id]);
            r.total_orders = parseInt(perf.rows[0].total_orders || 0);
            r.revenue = parseFloat(perf.rows[0].revenue || 0);
        }

        res.json({ success: true, restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/restaurants/:id', isAdmin, async (req, res) => {
    const { business_name, owner_name, owner_phone, city, is_verified, is_open } = req.body;
    try {
        await pool.query(`
            UPDATE restaurants 
            SET business_name=$1, owner_name=$2, owner_phone=$3, city=$4, is_verified=$5, is_open=$6, updated_at=CURRENT_TIMESTAMP
            WHERE id=$7`,
            [business_name, owner_name, owner_phone, city, is_verified, is_open, req.params.id]
        );
        res.json({ success: true, message: 'Restaurant updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH: Toggle admin-level visibility (Active / Inactive) for a restaurant
router.patch('/restaurants/:id/status', isAdmin, async (req, res) => {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_active must be a boolean.' });
    }
    try {
        await pool.query(
            `UPDATE restaurants SET is_active=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2`,
            [is_active, req.params.id]
        );
        res.json({ success: true, message: `Restaurant ${is_active ? 'activated' : 'deactivated'} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH: Approve or reject a restaurant registration
router.patch('/restaurants/:id/approval', isAdmin, async (req, res) => {
    const { action } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!['approved', 'rejected', 'pending'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action. Use approved, rejected, or pending.' });
    }
    try {
        // When approved, also set is_verified=true. When rejected/pending, set is_verified=false.
        const isVerified = action === 'approved';
        await pool.query(
            `UPDATE restaurants SET approval_status=$1, is_verified=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
            [action, isVerified, req.params.id]
        );
        res.json({ success: true, message: `Restaurant ${action} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// Global Orders Monitoring
// ============================================

router.get('/orders', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, 
                   u.full_name as customer_name, 
                   r.business_name as restaurant_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            ORDER BY o.created_at DESC
        `);
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// System Payments (same as orders but tailored for payment logs)
router.get('/payments', isAdmin, async (req, res) => {
    try {
        // In a real system you'd have a payouts table
        const result = await pool.query(`
            SELECT o.id, o.total_amount, o.order_status, o.created_at as transaction_date,
                   u.full_name as customer_name,
                   r.business_name as restaurant_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            WHERE o.order_status IN ('delivered', 'ready')
            ORDER BY o.created_at DESC
        `);

        // Platform fee assumed 10%
        const logs = result.rows.map(row => {
            const total = parseFloat(row.total_amount);
            const fee = total * 0.1;
            return {
                id: row.id,
                date: row.transaction_date,
                customer: row.customer_name,
                restaurant: row.restaurant_name,
                amount: total,
                platform_fee: fee,
                payout: total - fee,
                status: 'completed'
            };
        });

        res.json({ success: true, transactions: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Flash Sale Management
router.post('/flash-sale/rotate', isAdmin, async (req, res) => {
    try {
        const result = await rotateFlashSale();
        res.json({ success: true, message: `Flash sale rotated successfully. ${result.count} items picked.`, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
