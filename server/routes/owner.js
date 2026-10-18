import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { hashPassword, comparePassword } from '../components/hash.js';
import { invalidateTags, invalidatePrefix, sendCached, HttpError } from '../cache.js';

const router = express.Router();

// Helper: the restaurant id for the current owner (JWT set by verifyToken/requireOwner).
const rid = (req) => req.userId || req.session?.restaurantId;

// Drop all cached views for this restaurant (and any catalog entry that
// reflects its menu/stock/settings). Called after successful mutations.
const invalidateRestaurant = (restaurantId) => {
  if (!restaurantId) return;
  invalidatePrefix(`own:${restaurantId}:`);
};

// Middleware to check if owner is authenticated via JWT
// Note: index.js already calls verifyToken, so req.userId and req.user are populated.
// Middleware to check if owner is authenticated via JWT
const requireOwner = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    console.log("[OWNER AUTH] ❌ No token found");
    return res.status(401).json({ success: false, message: 'Unauthorized. Owner token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-123');
    req.userId = decoded.id;
    req.user = decoded;
    
    // Legacy session support
    if (req.session) {
      req.session.restaurantId = decoded.id;
    }
    
    next();
  } catch (err) {
    console.error("[OWNER AUTH] ❌ Token invalid:", err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ==========================================
// AUTHENTICATION
// ==========================================

router.post('/register', async (req, res) => {
  const {
    businessName,
    businessAddress,
    city,
    province,
    permitNumber,
    ownerName,
    ownerPhone,
    businessEmail,
    username,
    password,
    restaurant_logo_url
  } = req.body;

  if (!businessName || !businessEmail || !username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUsername = username || businessEmail.split('@')[0];

    const result = await pool.query(
      `INSERT INTO restaurants 
       (business_name, business_address, city, province, permit_number, owner_name, owner_phone, business_email, username, password_hash, restaurant_logo_url, approval_status, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', false) RETURNING id, business_name, username, approval_status`,
      [businessName, businessAddress, city, province, permitNumber, ownerName, ownerPhone, businessEmail, newUsername, hashedPassword, restaurant_logo_url || null]
    );

    const restaurant = result.rows[0];
    // DO NOT start a session — account must be approved first
    res.status(201).json({
      success: true,
      pending: true,
      message: "Registration submitted! Your account is pending admin approval. You will be able to log in once approved.",
      user: { id: restaurant.id, business_name: restaurant.business_name, username: restaurant.username }
    });
  } catch (error) {
    console.error('Restaurant Registration Error:', error);
    if (error.code === '23505') {
      let msg = "Username or email already exists";
      if (error.constraint) {
        if (error.constraint.includes('business_email')) msg = "Business email already registered.";
        else if (error.constraint.includes('username')) msg = "Username already taken.";
        else if (error.constraint.includes('permit_number')) msg = "Permit number already registered.";
      }
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: "Error registering restaurant: " + error.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }
  
  try {
    const isEmail = username.includes('@');
    const query = isEmail 
      ? "SELECT * FROM restaurants WHERE business_email = $1"
      : "SELECT * FROM restaurants WHERE username = $1";

    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const restaurant = result.rows[0];
    const isPasswordValid = await comparePassword(password, restaurant.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ── APPROVAL GATE ──────────────────────────────────────────────
    const status = restaurant.approval_status || 'pending';
    if (status === 'rejected') {
      return res.status(403).json({
        success: false,
        approvalStatus: 'rejected',
        message: "Your registration was rejected by an administrator. Please contact support for more information."
      });
    }
    // Pending is allowed to log in — they'll see the pending banner inside the dashboard
    // ───────────────────────────────────────────────────────────────
    
    req.userId = restaurant.id;
    if (req.session) {
      req.session.restaurantId = restaurant.id;
      req.session.restaurantName = restaurant.business_name;
      req.session.userRole = 'owner';
      req.session.approvalStatus = restaurant.approval_status;
    }
    
    // Issue JWT Token (minimal payload: id, email)
    const token = jwt.sign(
      { id: restaurant.id, email: restaurant.business_email, role: 'owner' },
      process.env.JWT_SECRET || 'super-secret-key-123',
      { expiresIn: '7d' }
    );

    console.log(`[OWNER LOGIN] Token generated for ${restaurant.business_email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: restaurant.id, name: restaurant.business_name, email: restaurant.business_email },
      token,
      approvalStatus: restaurant.approval_status
    });
  } catch (error) {
    console.error('Restaurant Login Error:', error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});


router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: "Error logging out" });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

// ==========================================
// PROTECTED ROUTES (Require Owner Login)
// ==========================================
router.use(requireOwner);

router.get('/session', async (req, res) => {
  // Now requireOwner has run, so req.userId is populated if a valid JWT was provided.
  const restaurantId = req.userId || (req.userId || req.session.restaurantId);
  
  if (restaurantId) {
    try {
      // Always fetch fresh approval_status from DB so stale sessions don't break anything
      const result = await pool.query('SELECT id, business_name, approval_status FROM restaurants WHERE id = $1', [restaurantId]);
      if (result.rows.length === 0) {
        return res.status(200).json({ session: false });
      }
      const r = result.rows[0];
      const approvalStatus = r.approvalStatus || r.approval_status || 'approved';
      
      res.status(200).json({
        session: true,
        restaurantId: r.id,
        name: r.business_name,
        approvalStatus
      });
    } catch (err) {
      console.error("[SESSION] Error fetching restaurant:", err);
      res.status(200).json({ session: false });
    }
  } else {
    res.status(200).json({ session: false });
  }
});

// Middleware: blocks write actions if account is not yet approved.
// Looks up the CURRENT approval_status in the DB (not the session), so
// approving a restaurant takes effect immediately without requiring the
// owner to log out and back in.
const requireApproved = async (req, res, next) => {
  const restaurantId = req.userId || req.session?.restaurantId;

  if (!restaurantId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in again.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT approval_status FROM restaurants WHERE id = $1',
      [restaurantId]
    );
    const status = result.rows[0]?.approval_status || 'pending';

    // Keep the session in sync so banners/other handlers reflect reality
    if (req.session) req.session.approvalStatus = status;

    if (status !== 'approved') {
      return res.status(403).json({
        success: false,
        approvalStatus: status,
        message: `Your account is ${status}. You cannot perform this action until your registration is approved by an administrator.`
      });
    }
    next();
  } catch (err) {
    console.error('[REQUIRE APPROVED] Error:', err.message);
    res.status(500).json({ success: false, message: 'Unable to verify approval status. Please try again.' });
  }
};

router.get('/dashboard', async (req, res) => {
  const rId = rid(req);
  // 15s TTL: dashboard is polled ~30s; invalidated on order/menu changes.
  await sendCached(req, res, `own:${rId}:dashboard`, {
    ttlMs: 15_000,
    cacheControl: 'private, no-store',
  }, async () => {
    // All metric queries run in parallel instead of 9 sequential round-trips.
    const [
      ordersRes, revenueRes, activeRes, menuRes, recentRes,
      weeklyRevenue, orderHeatmap, topItems, todayCounts
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM orders WHERE restaurant_id = $1", [rId]),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE restaurant_id = $1 AND order_status IN ('delivered', 'ready')", [rId]),
      pool.query("SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_status NOT IN ('delivered', 'ready', 'cancelled')", [rId]),
      pool.query("SELECT COUNT(*) FROM menu_items WHERE restaurant_id = $1", [rId]),
      pool.query(`
        SELECT o.id, u.full_name as customer_name, o.total_amount, o.order_status as status, o.created_at as time,
               (SELECT json_agg(json_build_object('name', mi.item_name))
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = o.id) as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.restaurant_id = $1 
        ORDER BY o.created_at DESC LIMIT 8`, [rId]),
      // Weekly revenue (last 7 days, grouped by day-of-week)
      pool.query(`
        SELECT DATE(created_at) as date,
               EXTRACT(DOW FROM created_at) as dow,
               COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE restaurant_id = $1
          AND order_status IN ('delivered', 'ready')
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at), EXTRACT(DOW FROM created_at)
        ORDER BY date ASC
      `, [rId]).then(r => r.rows).catch(() => []),
      // Hourly order heatmap (last 7 days) – by DOW + hour
      pool.query(`
        SELECT EXTRACT(DOW FROM created_at) as dow,
               EXTRACT(HOUR FROM created_at) as hour,
               COUNT(*) as count
        FROM orders
        WHERE restaurant_id = $1
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
        ORDER BY dow, hour
      `, [rId]).then(r => r.rows).catch(() => []),
      // Top-selling menu items (price_at_order is the historical price column)
      pool.query(`
        SELECT mi.item_name as name, mi.image_url as image, mi.price,
               COUNT(oi.id) as order_count, COALESCE(SUM(oi.price_at_order * oi.quantity), 0) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.restaurant_id = $1
          AND o.order_status IN ('delivered', 'ready')
        GROUP BY mi.item_name, mi.image_url, mi.price
        ORDER BY order_count DESC
        LIMIT 5
      `, [rId]).then(r => r.rows).catch(() => []),
      // Today / yesterday order counts in one round-trip
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE - 1) as yesterday
        FROM orders WHERE restaurant_id = $1
      `, [rId]).then(r => ({
        todayOrders: parseInt(r.rows[0].today) || 0,
        yesterdayOrders: parseInt(r.rows[0].yesterday) || 0,
      })).catch(() => ({ todayOrders: 0, yesterdayOrders: 0 })),
    ]);

    return {
      success: true,
      metrics: {
        totalOrders: parseInt(ordersRes.rows[0].count),
        revenue: parseFloat(revenueRes.rows[0].total),
        activeOrders: parseInt(activeRes.rows[0].count),
        menuItems: parseInt(menuRes.rows[0].count),
        todayOrders: todayCounts.todayOrders,
        yesterdayOrders: todayCounts.yesterdayOrders
      },
      recentOrders: recentRes.rows,
      weeklyRevenue,
      orderHeatmap,
      topItems
    };
  });
});

// Menu Management
router.get('/menu', async (req, res) => {
  const rId = rid(req);
  await sendCached(req, res, `own:${rId}:menu`, {
    ttlMs: 30_000,
    cacheControl: 'private, no-store',
  }, async () => {
    const result = await pool.query("SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id DESC", [rId]);
    return { success: true, items: result.rows };
  });
});

router.post('/menu', requireApproved, async (req, res) => {
  const { name, description, price, half_price, large_price, category, isAvailable, image_url, inventory_count } = req.body;
  try {
    // inventory_count >= 0 means it's a tracked stock item; treat it as daily_stock
    const ds = (inventory_count !== undefined && inventory_count !== null && inventory_count >= 0) ? inventory_count : null;
    const result = await pool.query(
      `INSERT INTO menu_items 
        (restaurant_id, item_name, description, price, half_price, large_price, category, is_available, image_url, inventory_count, daily_stock, current_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [(req.userId || req.session.restaurantId), name, description, price, half_price || null, large_price || null, category, isAvailable ?? true, image_url, inventory_count ?? -1, ds, ds]
    );
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food', 'categories');
    res.status(201).json({ success: true, message: 'Item added', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/menu/:id', requireApproved, async (req, res) => {
  const { name, description, price, half_price, large_price, category, isAvailable, image_url, inventory_count } = req.body;
  try {
    // Only update daily_stock if a valid inventory count is passed (not -1 = unlimited)
    const ds = (inventory_count !== undefined && inventory_count !== null && inventory_count >= 0) ? inventory_count : null;
    await pool.query(
      `UPDATE menu_items 
       SET item_name=$1, description=$2, price=$3, half_price=$4, large_price=$5, category=$6, 
           is_available=$7, image_url=$8, inventory_count=$9,
           daily_stock = COALESCE($10, daily_stock)
       WHERE id=$11 AND restaurant_id=$12`,
      [name, description, price, half_price || null, large_price || null, category, isAvailable, image_url, inventory_count, ds, req.params.id, (req.userId || req.session.restaurantId)]
    );
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food', 'categories');
    res.status(200).json({ success: true, message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/menu/:id', requireApproved, async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1 AND restaurant_id=$2", [req.params.id, (req.userId || req.session.restaurantId)]);
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food', 'categories');
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// BUDGET MEAL COMBINATIONS MANAGEMENT
// ==========================================

// GET all combinations (with their option slots) for a given menu item
router.get('/menu/:menuItemId/combinations', async (req, res) => {
  const { menuItemId } = req.params;
  const rId = rid(req);
  await sendCached(req, res, `own:${rId}:combos:${menuItemId}`, {
    ttlMs: 30_000,
    cacheControl: 'private, no-store',
  }, async () => {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM menu_items WHERE id=$1 AND restaurant_id=$2',
      [menuItemId, rId]
    );
    if (!ownerCheck.rows.length) throw new HttpError(404, 'Menu item not found');

    const combRes = await pool.query(
      'SELECT id, label, price FROM budget_meal_combinations WHERE menu_item_id=$1 ORDER BY id',
      [menuItemId]
    );
    const combinationIds = combRes.rows.map(c => c.id);
    const optsByCombo = {};
    if (combinationIds.length > 0) {
      const optsRes = await pool.query(
        'SELECT id, combination_id, component_type, slot_index, option_name FROM budget_meal_options WHERE combination_id = ANY($1::int[]) ORDER BY slot_index, id',
        [combinationIds]
      );
      for (const opt of optsRes.rows) {
        (optsByCombo[opt.combination_id] ||= []).push(opt);
      }
    }
    const combinations = combRes.rows.map(combo => {
      // Group options by slot
      const slots = {};
      for (const opt of optsByCombo[combo.id] || []) {
        const key = `${opt.slot_index}_${opt.component_type}`;
        if (!slots[key]) slots[key] = { slot_index: opt.slot_index, component_type: opt.component_type, options: [] };
        slots[key].options.push({ id: opt.id, name: opt.option_name });
      }
      return {
        id: combo.id,
        label: combo.label,
        price: Number(combo.price),
        slots: Object.values(slots).sort((a, b) => a.slot_index - b.slot_index)
      };
    });
    return { success: true, combinations };
  });
});

// POST: Create a new combination with its slots and options
// Body: { label, price, slots: [{ component_type, slot_index, options: ['Beef', 'Pork', ...] }] }
router.post('/menu/:menuItemId/combinations', requireApproved, async (req, res) => {
  const { menuItemId } = req.params;
  const { label, price, slots } = req.body;
  if (!label || price == null || !Array.isArray(slots)) {
    return res.status(400).json({ success: false, message: 'Missing combination data' });
  }
  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM menu_items WHERE id=$1 AND restaurant_id=$2',
      [menuItemId, (req.userId || req.session.restaurantId)]
    );
    if (!ownerCheck.rows.length) return res.status(404).json({ success: false, message: 'Menu item not found' });

    const combRes = await pool.query(
      'INSERT INTO budget_meal_combinations (menu_item_id, label, price) VALUES ($1,$2,$3) RETURNING id',
      [menuItemId, label, price]
    );
    const combinationId = combRes.rows[0].id;

    // Insert options per slot
    for (const slot of slots) {
      for (const optionName of (slot.options || [])) {
        if (optionName && optionName.trim()) {
          await pool.query(
            'INSERT INTO budget_meal_options (combination_id, component_type, slot_index, option_name) VALUES ($1,$2,$3,$4)',
            [combinationId, slot.component_type, slot.slot_index, optionName.trim()]
          );
        }
      }
    }
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food');
    res.status(201).json({ success: true, combinationId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a combination (cascades to options)
router.delete('/menu/:menuItemId/combinations/:combinationId', async (req, res) => {
  try {
    const { menuItemId, combinationId } = req.params;
    // Verify ownership via the menu item
    const ownerCheck = await pool.query(
      `SELECT bmc.id FROM budget_meal_combinations bmc
       JOIN menu_items mi ON bmc.menu_item_id = mi.id
       WHERE bmc.id=$1 AND mi.restaurant_id=$2`,
      [combinationId, (req.userId || req.session.restaurantId)]
    );
    if (!ownerCheck.rows.length) return res.status(404).json({ success: false, message: 'Combination not found' });
    await pool.query('DELETE FROM budget_meal_combinations WHERE id=$1', [combinationId]);
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT: Replace all combinations for a menu item (full update – delete all then re-insert)
// Body: { combinations: [{ label, price, slots: [{ component_type, slot_index, options: [] }] }] }
router.put('/menu/:menuItemId/combinations', async (req, res) => {
  const { menuItemId } = req.params;
  const { combinations } = req.body;
  if (!Array.isArray(combinations)) {
    return res.status(400).json({ success: false, message: 'combinations array required' });
  }
  try {
    const ownerCheck = await pool.query(
      'SELECT id FROM menu_items WHERE id=$1 AND restaurant_id=$2',
      [menuItemId, (req.userId || req.session.restaurantId)]
    );
    if (!ownerCheck.rows.length) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Delete all existing combinations (options cascade)
    await pool.query('DELETE FROM budget_meal_combinations WHERE menu_item_id=$1', [menuItemId]);

    // Re-insert
    for (const combo of combinations) {
      const combRes = await pool.query(
        'INSERT INTO budget_meal_combinations (menu_item_id, label, price) VALUES ($1,$2,$3) RETURNING id',
        [menuItemId, combo.label, combo.price]
      );
      const combinationId = combRes.rows[0].id;
      for (const slot of (combo.slots || [])) {
        for (const optionName of (slot.options || [])) {
          if (optionName && optionName.trim()) {
            await pool.query(
              'INSERT INTO budget_meal_options (combination_id, component_type, slot_index, option_name) VALUES ($1,$2,$3,$4)',
              [combinationId, slot.component_type, slot.slot_index, optionName.trim()]
            );
          }
        }
      }
    }
    res.status(200).json({ success: true });
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('food');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Order Management
router.get('/orders', async (req, res) => {
  const rId = rid(req);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
  // 4s TTL: order list is polled every ~5s; status changes invalidate it.
  await sendCached(req, res, `own:${rId}:orders:${limit}`, {
    ttlMs: 4_000,
    cacheControl: 'private, no-store',
  }, async () => {
    const result = await pool.query(`
      SELECT o.*, 
             u.full_name as customer_name,
             u.phone as customer_phone,
             (SELECT json_agg(json_build_object('name', mi.item_name, 'quantity', oi.quantity, 'price', oi.price_at_order))
              FROM order_items oi
              JOIN menu_items mi ON oi.menu_item_id = mi.id
              WHERE oi.order_id = o.id) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = $1
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `, [rId]);
    
    return { success: true, orders: result.rows };
  });
});

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE orders SET order_status = $1 WHERE id = $2 AND restaurant_id = $3", [status, req.params.id, (req.userId || req.session.restaurantId)]);
    // Status change: this restaurant's order list + customer order lists + admin views are stale.
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('orders', 'adm:orders', 'adm:payments');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics – enriched
router.get('/analytics', async (req, res) => {
  const ridv = rid(req);
  // 60s TTL: analytics are inherently historical; safe to serve slightly stale.
  await sendCached(req, res, `own:${ridv}:analytics`, {
    ttlMs: 60_000,
    cacheControl: 'private, no-store',
  }, async () => {
    const [dailyRes, weekRes, statusRes, topItems, custRes] = await Promise.all([
      // 1. Daily revenue + orders for last 30 days
      pool.query(`
        SELECT DATE(created_at) as date,
               SUM(total_amount) as daily_revenue,
               COUNT(*) as daily_orders
        FROM orders
        WHERE restaurant_id = $1
          AND order_status IN ('delivered', 'ready')
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [ridv]),
      // 2. This week vs last week revenue
      pool.query(`
        SELECT
          SUM(CASE WHEN created_at >= date_trunc('week', NOW()) THEN total_amount ELSE 0 END) as this_week,
          SUM(CASE WHEN created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
                    AND created_at <  date_trunc('week', NOW()) THEN total_amount ELSE 0 END) as last_week,
          SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN total_amount ELSE 0 END) as this_month,
          SUM(CASE WHEN created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                    AND created_at <  date_trunc('month', NOW()) THEN total_amount ELSE 0 END) as last_month
        FROM orders
        WHERE restaurant_id = $1 AND order_status IN ('delivered', 'ready')
      `, [ridv]),
      // 3. Order status breakdown (all time)
      pool.query(`
        SELECT order_status as status, COUNT(*) as count
        FROM orders
        WHERE restaurant_id = $1
        GROUP BY order_status
      `, [ridv]),
      // 4. Top selling menu items (price_at_order is the historical price column)
      pool.query(`
        SELECT mi.item_name as name, COUNT(oi.id) as orders, SUM(oi.price_at_order * oi.quantity) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.restaurant_id = $1
          AND o.order_status IN ('delivered', 'ready')
        GROUP BY mi.item_name
        ORDER BY orders DESC
        LIMIT 5
      `, [ridv]).then(r => r.rows).catch(() => []),
      // 5. Unique customers this month
      pool.query(`
        SELECT COUNT(DISTINCT user_id) as customers
        FROM orders
        WHERE restaurant_id = $1
          AND created_at >= date_trunc('month', NOW())
      `, [ridv]),
    ]);

    const periods = weekRes.rows[0] || {};
    return {
      success: true,
      analytics: dailyRes.rows,
      periods: {
        thisWeek:  parseFloat(periods.this_week  || 0),
        lastWeek:  parseFloat(periods.last_week  || 0),
        thisMonth: parseFloat(periods.this_month || 0),
        lastMonth: parseFloat(periods.last_month || 0),
      },
      statusBreakdown: statusRes.rows,
      topItems,
      customersThisMonth: parseInt(custRes.rows[0]?.customers || 0),
    };
  });
});

// Settings
router.get('/settings', async (req, res) => {
  const rId = rid(req);
  await sendCached(req, res, `own:${rId}:settings`, {
    ttlMs: 60_000,
    cacheControl: 'private, no-store',
  }, async () => {
    const result = await pool.query("SELECT business_name, business_address, city, owner_name, owner_phone, business_email, description, restaurant_logo_url FROM restaurants WHERE id = $1", [rId]);
    return { success: true, settings: result.rows[0] };
  });
});

router.put('/settings', async (req, res) => {
  const { business_name, business_address, city, owner_name, owner_phone, description, restaurant_logo_url } = req.body;
  try {
    await pool.query(`
      UPDATE restaurants SET business_name=$1, business_address=$2, city=$3, owner_name=$4, owner_phone=$5, description=$6, restaurant_logo_url=$7
      WHERE id=$8
    `, [business_name, business_address, city, owner_name, owner_phone, description, restaurant_logo_url, (req.userId || req.session.restaurantId)]);
    // Name/logo appear in the public restaurant + food lists.
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidateTags('restaurants', 'food');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// INVENTORY MANAGEMENT (Daily Stock System)
// ==========================================

/**
 * GET /api/owner/inventory
 * Returns all menu items for the restaurant with stock tracking info
 */
router.get('/inventory', async (req, res) => {
  const rId = rid(req);
  // 30s TTL matches the page's 30s poll; owner edits invalidate immediately.
  await sendCached(req, res, `own:${rId}:inv`, {
    ttlMs: 30_000,
    cacheControl: 'private, no-store',
  }, async () => {
    const result = await pool.query(
      `SELECT id, item_name, category, price, is_available,
              daily_stock, current_stock, inventory_count,
              image_url, description, updated_at
       FROM menu_items
       WHERE restaurant_id = $1
       ORDER BY category, item_name`,
      [rId]
    );
    return { success: true, items: result.rows };
  });
});

/**
 * PUT /api/owner/inventory/:id
 * Update the daily_stock (and optionally current_stock) for a single menu item.
 * Body: { daily_stock: number, sync_current?: boolean, is_available?: boolean }
 *   - daily_stock: the new daily quota (null = unlimited)
 *   - sync_current: if true, also set current_stock = daily_stock (fresh reset)
 *   - is_available: toggle visibility
 */
router.put('/inventory/:id', async (req, res) => {
  const { daily_stock, sync_current, is_available } = req.body;
  const itemId = req.params.id;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2',
      [itemId, (req.userId || req.session.restaurantId)]
    );
    if (!ownerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    // daily_stock: accept null (unlimited) or non-negative integer
    if (daily_stock !== undefined) {
      const ds = daily_stock === null || daily_stock === '' ? null : parseInt(daily_stock);
      fields.push(`daily_stock = $${idx++}`);
      values.push(ds);

      if (sync_current || sync_current === undefined) {
        // Also reset current_stock to the new daily_stock
        fields.push(`current_stock = $${idx++}`);
        values.push(ds);
      }
    }

    if (is_available !== undefined) {
      fields.push(`is_available = $${idx++}`);
      values.push(Boolean(is_available));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    values.push(itemId);
    await pool.query(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    // Return updated item
    const updated = await pool.query(
      `SELECT id, item_name, daily_stock, current_stock, is_available FROM menu_items WHERE id = $1`,
      [itemId]
    );
    // Stock/availability changed: catalog + stock + owner views are stale.
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidatePrefix('stock:');
    invalidateTags('food');
    res.status(200).json({ success: true, item: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/owner/inventory/:id/current
 * Directly update only current_stock (for manual mid-day adjustments)
 * Body: { current_stock: number }
 */
router.patch('/inventory/:id/current', async (req, res) => {
  const { current_stock } = req.body;
  const itemId = req.params.id;

  if (current_stock === undefined) {
    return res.status(400).json({ success: false, message: 'current_stock is required' });
  }

  try {
    const ownerCheck = await pool.query(
      'SELECT id, daily_stock FROM menu_items WHERE id = $1 AND restaurant_id = $2',
      [itemId, (req.userId || req.session.restaurantId)]
    );
    if (!ownerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const item = ownerCheck.rows[0];
    const newCurrent = parseInt(current_stock);

    // Validate: current_stock cannot exceed daily_stock
    if (item.daily_stock !== null && newCurrent > item.daily_stock) {
      return res.status(400).json({
        success: false,
        message: `current_stock (${newCurrent}) cannot exceed daily_stock (${item.daily_stock})`
      });
    }

    await pool.query(
      `UPDATE menu_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [Math.max(0, newCurrent), itemId]
    );

    const updated = await pool.query(
      `SELECT id, item_name, daily_stock, current_stock, is_available FROM menu_items WHERE id = $1`,
      [itemId]
    );
    invalidateRestaurant(req.userId || req.session.restaurantId);
    invalidatePrefix('stock:');
    invalidateTags('food');
    res.status(200).json({ success: true, item: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/owner/inventory/reset
 * Manually trigger stock reset: current_stock = daily_stock
 * Body: { item_id?: number } – if omitted, resets ALL items for this restaurant
 */
router.post('/inventory/reset', async (req, res) => {
  const { item_id } = req.body || {};
  const restaurantId = (req.userId || req.session.restaurantId);

  try {
    let result;
    if (item_id) {
      // Single item reset
      const ownerCheck = await pool.query(
        'SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2',
        [item_id, restaurantId]
      );
      if (!ownerCheck.rows.length) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }
      result = await pool.query(
        `UPDATE menu_items
         SET current_stock = daily_stock, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND restaurant_id = $2 AND daily_stock IS NOT NULL`,
        [item_id, restaurantId]
      );
    } else {
      // Reset all items in this restaurant
      result = await pool.query(
        `UPDATE menu_items
         SET current_stock = daily_stock, updated_at = CURRENT_TIMESTAMP
         WHERE restaurant_id = $1 AND daily_stock IS NOT NULL`,
        [restaurantId]
      );
    }

    invalidateRestaurant(restaurantId);
    invalidatePrefix('stock:');
    invalidateTags('food');
    res.status(200).json({
      success: true,
      message: `Stock reset complete. ${result.rowCount} item(s) refreshed.`,
      itemsReset: result.rowCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
