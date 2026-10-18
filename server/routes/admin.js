import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { comparePassword, hashPassword } from '../components/hash.js';
import { rotateFlashSale } from '../components/flashSale.js';
import { invalidateTags, sendCached } from '../cache.js';

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
    req.session.destroy((err) => {
        if (err) console.error('[ADMIN LOGOUT] Session destroy error:', err.message);
        res.clearCookie('bitehub.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
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
    // 30s TTL; queries run in parallel instead of sequentially.
    await sendCached(req, res, 'adm:analytics', {
        ttlMs: 30_000,
        cacheControl: 'private, no-store',
    }, async () => {
        const [usersCount, restaurantsCount, ordersCount, totalRevenue, growthResult] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM users"),
            pool.query("SELECT COUNT(*) FROM restaurants"),
            pool.query("SELECT COUNT(*) FROM orders"),
            pool.query("SELECT SUM(total_amount) FROM orders WHERE order_status IN ('delivered', 'ready')"),
            // "daily" growth approx for last 30 days
            pool.query(`
                SELECT DATE(created_at) as date, SUM(total_amount) as revenue
                FROM orders
                WHERE created_at >= NOW() - INTERVAL '30 days'
                  AND (order_status IN ('delivered', 'ready'))
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `),
        ]);

        return {
            success: true,
            analytics: {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalRestaurants: parseInt(restaurantsCount.rows[0].count),
                totalOrders: parseInt(ordersCount.rows[0].count),
                totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
                revenueTrend: growthResult.rows.map(r => ({ date: r.date, revenue: parseFloat(r.revenue) }))
            }
        };
    });
});

// ============================================
// Users Management
// ============================================

// Detect once (not per request) whether users.role exists. The original code
// ran a guaranteed-to-fail query on EVERY request just to fall back.
let usersHasRoleColumn;
async function probeUsersRoleColumn() {
    if (usersHasRoleColumn === undefined) {
        try {
            await pool.query('SELECT role FROM users LIMIT 0');
            usersHasRoleColumn = true;
        } catch {
            usersHasRoleColumn = false;
        }
    }
    return usersHasRoleColumn;
}

router.get('/users', isAdmin, async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 1000);
    await sendCached(req, res, `adm:users:${limit}`, {
        ttlMs: 15_000,
        tags: ['adm:users'],
        cacheControl: 'private, no-store',
    }, async () => {
        const hasRole = await probeUsersRoleColumn();
        if (hasRole) {
            const result = await pool.query(
                'SELECT id, full_name, email, phone, role, is_active, department, course, year, created_at FROM users ORDER BY created_at DESC LIMIT $1',
                [limit]
            );
            return { success: true, users: result.rows };
        }
        const fallbackResult = await pool.query(
            'SELECT id, full_name, email, phone, is_active, department, course, year, created_at FROM users ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        return { success: true, users: fallbackResult.rows.map(u => ({...u, role: 'customer'})) };
    });
});

router.patch('/users/:id/status', isAdmin, async (req, res) => {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_active must be a boolean' });
    }
    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
            [is_active, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        invalidateTags('adm:users');
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
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 1000);
    await sendCached(req, res, `adm:restaurants:${limit}`, {
        ttlMs: 15_000,
        tags: ['adm:restaurants'],
        cacheControl: 'private, no-store',
    }, async () => {
        // One query with an aggregate join instead of 1 query per restaurant (N+1).
        const result = await pool.query(`
            SELECT r.id, r.business_name, r.owner_name, r.business_email, r.owner_phone,
                   r.city, r.cuisine_type, r.is_verified, r.is_open, r.is_active,
                   r.rating, r.approval_status, r.created_at,
                   COALESCE(p.total_orders, 0) as total_orders,
                   COALESCE(p.revenue, 0) as revenue,
                   COALESCE(p.today_orders, 0) as today_orders,
                   COALESCE(p.today_sales, 0) as today_sales,
                   p.last_order_at
            FROM restaurants r
            LEFT JOIN (
                SELECT restaurant_id,
                       COUNT(*) as total_orders,
                       SUM(total_amount) as revenue,
                       COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_orders,
                       SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE) as today_sales,
                       MAX(created_at) as last_order_at
                FROM orders
                WHERE order_status IN ('delivered', 'ready')
                GROUP BY restaurant_id
            ) p ON p.restaurant_id = r.id
            ORDER BY r.created_at DESC
            LIMIT $1
        `, [limit]);

        const restaurants = result.rows.map(r => {
            const totalOrders = parseInt(r.total_orders) || 0;
            const revenue = parseFloat(r.revenue) || 0;
            return {
                ...r,
                total_orders: totalOrders,
                revenue,
                today_orders: parseInt(r.today_orders) || 0,
                today_sales: parseFloat(r.today_sales) || 0,
                avg_order_value: totalOrders > 0 ? revenue / totalOrders : 0,
            };
        });
        return { success: true, restaurants };
    });
});

// ============================================
// Restaurant Sales Analytics (daily / weekly)
// ============================================
router.get('/restaurant-analytics', isAdmin, async (req, res) => {
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 14, 7), 90);
    const weeks = Math.min(Math.max(Number.parseInt(req.query.weeks, 10) || 8, 4), 52);
    await sendCached(req, res, `adm:rest-analytics:${days}:${weeks}`, {
        ttlMs: 30_000,
        tags: ['adm:analytics', 'adm:restaurants', 'adm:orders'],
        cacheControl: 'private, no-store',
    }, async () => {
        const [dailyRes, weeklyRes, perRestaurantRes] = await Promise.all([
            // Daily revenue + order counts for the last N days
            pool.query(`
                SELECT DATE(created_at) as date,
                       COUNT(*) as orders,
                       COALESCE(SUM(total_amount), 0) as revenue
                FROM orders
                WHERE order_status IN ('delivered', 'ready')
                  AND created_at >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, [days]),
            // Weekly revenue + order counts for the last N weeks (ISO weeks, Monday start)
            pool.query(`
                SELECT date_trunc('week', created_at)::date as week,
                       COUNT(*) as orders,
                       COALESCE(SUM(total_amount), 0) as revenue
                FROM orders
                WHERE order_status IN ('delivered', 'ready')
                  AND created_at >= date_trunc('week', NOW()) - ($1::int - 1) * INTERVAL '1 week'
                GROUP BY date_trunc('week', created_at)
                ORDER BY week ASC
            `, [weeks]),
            // Per-restaurant breakdown (today / this week / all time)
            pool.query(`
                SELECT r.id, r.business_name, r.city,
                       COUNT(o.id) FILTER (WHERE o.created_at >= CURRENT_DATE) as today_orders,
                       COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= CURRENT_DATE), 0) as today_sales,
                       COUNT(*) FILTER (WHERE o.created_at >= date_trunc('week', NOW())) as week_orders,
                       COALESCE(SUM(o.total_amount) FILTER (WHERE o.created_at >= date_trunc('week', NOW())), 0) as week_sales,
                       COUNT(o.id) as total_orders,
                       COALESCE(SUM(o.total_amount), 0) as total_revenue
                FROM restaurants r
                LEFT JOIN orders o
                       ON o.restaurant_id = r.id
                      AND o.order_status IN ('delivered', 'ready')
                GROUP BY r.id, r.business_name, r.city
                ORDER BY week_sales DESC, total_revenue DESC
                LIMIT 100
            `),
        ]);

        const num = (v) => parseFloat(v) || 0;
        const int = (v) => parseInt(v) || 0;

        return {
            success: true,
            daily: dailyRes.rows.map(r => ({ date: r.date, orders: int(r.orders), revenue: num(r.revenue) })),
            weekly: weeklyRes.rows.map(r => ({ week: r.week, orders: int(r.orders), revenue: num(r.revenue) })),
            restaurants: perRestaurantRes.rows.map(r => ({
                id: r.id,
                business_name: r.business_name,
                city: r.city,
                today_orders: int(r.today_orders),
                today_sales: num(r.today_sales),
                week_orders: int(r.week_orders),
                week_sales: num(r.week_sales),
                total_orders: int(r.total_orders),
                total_revenue: num(r.total_revenue),
            })),
        };
    });
});

router.get('/restaurant-analytics/:id', isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid restaurant id' });
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 14, 7), 90);
    const weeks = Math.min(Math.max(Number.parseInt(req.query.weeks, 10) || 8, 4), 52);
    const infoRes = await pool.query(`SELECT id, business_name, city FROM restaurants WHERE id = $1`, [id]);
    if (infoRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    await sendCached(req, res, `adm:rest-analytics:${id}:${days}:${weeks}`, {
        ttlMs: 30_000,
        tags: ['adm:analytics', 'adm:restaurants', 'adm:orders'],
        cacheControl: 'private, no-store',
    }, async () => {
        const [dailyRes, weeklyRes, summaryRes, itemsRes] = await Promise.all([
            pool.query(`
                SELECT DATE(created_at) as date,
                       COUNT(*) as orders,
                       COALESCE(SUM(total_amount), 0) as revenue
                FROM orders
                WHERE restaurant_id = $1
                  AND order_status IN ('delivered', 'ready')
                  AND created_at >= CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, [id, days]),
            pool.query(`
                SELECT date_trunc('week', created_at)::date as week,
                       COUNT(*) as orders,
                       COALESCE(SUM(total_amount), 0) as revenue
                FROM orders
                WHERE restaurant_id = $1
                  AND order_status IN ('delivered', 'ready')
                  AND created_at >= date_trunc('week', NOW()) - ($2::int - 1) * INTERVAL '1 week'
                GROUP BY date_trunc('week', created_at)
                ORDER BY week ASC
            `, [id, weeks]),
            pool.query(`
                SELECT COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_orders,
                       COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_sales,
                       COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW())) as week_orders,
                       COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('week', NOW())), 0) as week_sales,
                       COUNT(*) as total_orders,
                       COALESCE(SUM(total_amount), 0) as total_revenue
                FROM orders
                WHERE restaurant_id = $1
                  AND order_status IN ('delivered', 'ready')
            `, [id]),
            pool.query(`
                SELECT m.item_name, COALESCE(SUM(oi.quantity), 0) as qty,
                       COALESCE(SUM(oi.quantity * oi.price_at_order), 0) as revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN menu_items m ON oi.menu_item_id = m.id
                WHERE o.restaurant_id = $1
                  AND o.order_status IN ('delivered', 'ready')
                GROUP BY m.id, m.item_name
                ORDER BY qty DESC, revenue DESC
                LIMIT 8
            `, [id]),
        ]);

        const num = (v) => parseFloat(v) || 0;
        const int = (v) => parseInt(v) || 0;
        const s = summaryRes.rows[0] || {};

        return {
            success: true,
            restaurant: infoRes.rows[0],
            daily: dailyRes.rows.map(r => ({ date: r.date, orders: int(r.orders), revenue: num(r.revenue) })),
            weekly: weeklyRes.rows.map(r => ({ week: r.week, orders: int(r.orders), revenue: num(r.revenue) })),
            summary: {
                today_orders: int(s.today_orders),
                today_sales: num(s.today_sales),
                week_orders: int(s.week_orders),
                week_sales: num(s.week_sales),
                total_orders: int(s.total_orders),
                total_revenue: num(s.total_revenue),
                avg_order_value: int(s.total_orders) > 0 ? num(s.total_revenue) / int(s.total_orders) : 0,
            },
            top_items: itemsRes.rows.map(r => ({ item_name: r.item_name, qty: int(r.qty), revenue: num(r.revenue) })),
        };
    });
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
        invalidateTags('adm:restaurants', 'adm:analytics', 'restaurants', 'food');
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
        // Visibility changed: public catalogs must reflect it immediately.
        invalidateTags('adm:restaurants', 'adm:analytics', 'restaurants', 'food');
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
        // When approved, also set is_verified=true and activate it so it appears
        // in the catalog. When rejected/pending, set is_verified=false (leave is_active as-is).
        // NOTE: is_active uses its own $3 param — reusing $1 inside the CASE makes
        // PostgreSQL fail with "inconsistent types deduced for parameter $1".
        const isVerified = action === 'approved';
        const activateNow = action === 'approved';
        await pool.query(
            `UPDATE restaurants 
             SET approval_status=$1, 
                 is_verified=$2, 
                 is_active = CASE WHEN $3 THEN TRUE ELSE is_active END, 
                 updated_at=CURRENT_TIMESTAMP
             WHERE id=$4`,
            [action, isVerified, activateNow, req.params.id]
        );
        invalidateTags('adm:restaurants', 'adm:analytics', 'restaurants', 'food');
        res.json({ success: true, message: `Restaurant ${action} successfully.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// Global Orders Monitoring
// ============================================

router.get('/orders', isAdmin, async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 1000);
    await sendCached(req, res, `adm:orders:${limit}`, {
        ttlMs: 10_000,
        tags: ['adm:orders'],
        cacheControl: 'private, no-store',
    }, async () => {
        const result = await pool.query(`
            SELECT o.*, 
                   u.full_name as customer_name, 
                   r.business_name as restaurant_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            ORDER BY o.created_at DESC
            LIMIT $1
        `, [limit]);
        return { success: true, orders: result.rows };
    });
});

// System Payments (same as orders but tailored for payment logs)
router.get('/payments', isAdmin, async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 1000);
    await sendCached(req, res, `adm:payments:${limit}`, {
        ttlMs: 10_000,
        tags: ['adm:payments'],
        cacheControl: 'private, no-store',
    }, async () => {
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
            LIMIT $1
        `, [limit]);

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

        return { success: true, transactions: logs };
    });
});

// Flash Sale Management
router.post('/flash-sale/rotate', isAdmin, async (req, res) => {
    try {
        const result = await rotateFlashSale();
        invalidateTags('flash');
        res.json({ success: true, message: `Flash sale rotated successfully. ${result.count} items picked.`, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
