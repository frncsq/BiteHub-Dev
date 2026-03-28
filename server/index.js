import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { pool } from './db.js';
import { hashPassword, comparePassword } from './components/hash.js';
import { mockRestaurantsData, mockFoodItems, mockCategories } from './mockData.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';

// ======================================================
// DAILY STOCK RESET SCHEDULER
// Resets current_stock = daily_stock for all menu items
// ======================================================
const scheduleDailyStockReset = () => {
  const runReset = async () => {
    try {
      const result = await pool.query(
        `UPDATE menu_items 
         SET current_stock = daily_stock, 
             updated_at = CURRENT_TIMESTAMP
         WHERE daily_stock IS NOT NULL AND daily_stock >= 0`
      );
      console.log(`✅ Daily stock reset complete — ${result.rowCount} items reset at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error('⚠️  Daily stock reset failed:', err.message);
    }
  };

  const scheduleNextReset = () => {
    const now = new Date();
    // Calculate milliseconds until next midnight (server local time)
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    console.log(`⏰ Next stock reset scheduled in ${Math.round(msUntilMidnight / 60000)} minutes (at midnight)`);
    setTimeout(async () => {
      await runReset();
      scheduleNextReset(); // Schedule the next day
    }, msUntilMidnight);
  };

  scheduleNextReset();
};

// Database connection test flag
let dbConnected = false;

// We use a DO block so this is idempotent and only converts if not already TEXT.
const getSessionOrders = (req) => {
  if (!req.session.orders) req.session.orders = [];
  return req.session.orders;
};

const ensureCampusLocationColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS course VARCHAR(255);
    `);
    console.log('✅ Ensured orders.department and orders.course columns exist');
  } catch (err) {
    console.warn('⚠️  Could not verify/alter orders campus columns:', err.message);
  }
};

const ensureMenuItemSizeColumns = async () => {
  try {
    // Ensure large_price column exists for drink size pricing
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS large_price NUMERIC(10, 2) DEFAULT NULL;
    `);
    // Ensure half_price column exists (Small size)
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS half_price NUMERIC(10, 2) DEFAULT NULL;
    `);
    console.log('✅ Ensured menu_items.half_price and menu_items.large_price columns exist');
  } catch (err) {
    console.warn('⚠️  Could not verify/alter menu_items size columns:', err.message);
  }
};

// ======================================================
// ENSURE STOCK COLUMNS EXIST
// ======================================================
const ensureStockColumns = async () => {
  try {
    // daily_stock: The fixed daily quota set by the owner (e.g. 30)
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS daily_stock INT DEFAULT NULL;
    `);
    // current_stock: The remaining stock for today (decremented on order)
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT NULL;
    `);
    // Ensure updated_at exists for tracking changes in inventory
    await pool.query(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    // Migrate: for any row where daily_stock is null but inventory_count > 0,
    // carry over legacy inventory_count into daily_stock and current_stock
    await pool.query(`
      UPDATE menu_items
      SET daily_stock = inventory_count,
          current_stock = inventory_count
      WHERE daily_stock IS NULL
        AND inventory_count IS NOT NULL
        AND inventory_count >= 0;
    `);
    console.log('✅ Ensured menu_items.daily_stock and menu_items.current_stock columns exist');
  } catch (err) {
    console.warn('⚠️  Could not ensure stock columns:', err.message);
  }
};

const ensureBudgetMealTables = async () => {
  try {
    // budget_meal_combinations: each row is a combo type (e.g. meat+veggie) with a price, tied to a menu_item
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budget_meal_combinations (
        id SERIAL PRIMARY KEY,
        menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        label VARCHAR(100) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // budget_meal_options: each row is one selectable food option under a combo component slot
    // component_type: 'meat' | 'veggie' | 'rice' | etc.
    // slot_index: 0-based index of which slot in the combo this belongs to
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budget_meal_options (
        id SERIAL PRIMARY KEY,
        combination_id INT NOT NULL REFERENCES budget_meal_combinations(id) ON DELETE CASCADE,
        component_type VARCHAR(50) NOT NULL,
        slot_index INT NOT NULL DEFAULT 0,
        option_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Also add index for fast lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bmc_menu_item ON budget_meal_combinations(menu_item_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bmo_combination ON budget_meal_options(combination_id);`);
    console.log('✅ Ensured budget_meal_combinations and budget_meal_options tables exist');
  } catch (err) {
    console.warn('⚠️  Could not ensure budget meal tables:', err.message);
  }
};

const ensureRestaurantIsActiveColumn = async () => {
  try {
    await pool.query(`
      ALTER TABLE restaurants
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);
    // Backfill: any approved restaurant that was already active should remain active
    await pool.query(`
      UPDATE restaurants SET is_active = TRUE WHERE is_active IS NULL;
    `);
    console.log('✅ Ensured restaurants.is_active column exists');
  } catch (err) {
    console.warn('⚠️  Could not ensure restaurants.is_active column:', err.message);
  }
};

const ensureRestaurantLogoUrlColumnIsText = async () => {
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'restaurants'
            AND column_name = 'restaurant_logo_url'
            AND data_type <> 'text'
        ) THEN
          ALTER TABLE restaurants ALTER COLUMN restaurant_logo_url TYPE TEXT;
          RAISE NOTICE 'Converted restaurant_logo_url to TEXT';
        END IF;
      END
      $$;
    `);
    console.log('✅ Ensured restaurants.restaurant_logo_url is TEXT (base64 images safe to store)');
  } catch (err) {
    console.warn('⚠️  Could not verify/alter restaurant_logo_url column type:', err.message);
  }
};

const seedDatabase = async () => {
  try {
    const restaurantsCount = await pool.query('SELECT COUNT(*) FROM restaurants');
    if (parseInt(restaurantsCount.rows[0].count) === 0) {
      console.log('🌱 Seeding restaurants table...');
      for (const r of mockRestaurantsData) {
        await pool.query(
          `INSERT INTO restaurants (id, business_name, cuisine_type, rating, description, restaurant_logo_url) 
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [r.id, r.name, r.type, r.rating, r.description, r.image]
        );
      }
    }

    const menuItemsCount = await pool.query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(menuItemsCount.rows[0].count) === 0) {
      console.log('🌱 Seeding menu_items table...');
      for (const item of mockFoodItems) {
        await pool.query(
          `INSERT INTO menu_items (id, restaurant_id, item_name, price, category, rating, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [item.id, item.restaurantId || 1, item.name, item.price, item.category, item.rating, item.image]
        );
      }
    }
    console.log('✅ Database seeded successfully');
  } catch (err) {
    console.warn('⚠️ Seeding failed:', err.message);
  }
};

(async () => {
  try {
    await pool.query('SELECT NOW()');
    dbConnected = true;
    console.log('✅ Database connected');
    await ensureRestaurantLogoUrlColumnIsText();
    await ensureCampusLocationColumns();
    await ensureMenuItemSizeColumns();
    await ensureStockColumns();
    await ensureBudgetMealTables();
    await ensureRestaurantIsActiveColumn();
    await seedDatabase();
    // Start daily stock reset scheduler after DB is confirmed available
    scheduleDailyStockReset();
  } catch (err) {
    dbConnected = false;
    console.log('⚠️  Database not available, using session storage for auth');
  }
})();

const app = express();
// Behind Vite (or any reverse proxy), trust X-Forwarded-* so sessions/cookies behave correctly
app.set('trust proxy', 1);

const sessionSecret = process.env.SESSION_SECRET || '1234567890';
const isProd = process.env.NODE_ENV === 'production';

// 1. Debugging: Log incoming requests and warn if cookies are large (potential 431 cause)
app.use((req, res, next) => {
  const o = req.headers.origin;
  const ref = req.headers.referer;
  const from = o || (ref ? `referer ${ref}` : 'same-origin');
  const cookieLen = req.headers.cookie ? req.headers.cookie.length : 0;
  
  if (cookieLen > 4000) {
    console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ LARGE COOKIE DETECTED (${cookieLen} chars) from ${from}`);
  }
  
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} — ${from}`);
  next();
});

// 2. CORS: reflect request Origin so credentialed requests work from any dev URL
//    (localhost / 127.0.0.1 / LAN IP). The cors package handles preflight reliably.
// 2. CORS: Strict configuration for credentialed requests
app.use(
  cors({
    origin: 'http://localhost:5173', // Allow exactly the frontend dev port
    credentials: true, // If sessions/cookies are still needed for some parts
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// 2b. JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // LOGGING: Debug incoming auth
  if (authHeader) {
      console.log(`[AUTH] ${req.method} ${req.path} — Token present: ${authHeader.substring(0, 15)}...`);
  } else {
      console.log(`[AUTH] ${req.method} ${req.path} — ❌ No token provided`);
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required (Bearer token missing)' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ success: false, message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-123');
    req.user = decoded;
    req.userId = decoded.id; // Correct extraction of user ID from token
    console.log(`[AUTH] ✅ Verified user ${decoded.email} (ID: ${decoded.id})`);
    next();
  } catch (err) {
    console.error("❌ JWT Verify Error:", err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
};

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(session({
  name: 'bitehub.sid', // Custom sid name
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Keep session alive on interaction
  cookie: {
    httpOnly: true,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: isProd ? 'none' : 'lax', // Use 'lax' for local dev, 'none' for HTTPS prod
    secure: isProd, // Must be true if sameSite: 'none'
  },
}));

// Routes
// Note: Some legacy routes use session, but we are prioritizing JWT
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
// Test Endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ success: true, message: "API working", timestamp: new Date() });
});



const PORT = process.env.PORT || 5000;

// ==========================================================
// Public "catalog" endpoints (client uses these in mock mode,
// but we also expose them for real backend usage).
// We support both `/...` and `/api/...` for compatibility.
// ==========================================================

const publicCatalogRouter = express.Router();

publicCatalogRouter.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category as name FROM menu_items WHERE category IS NOT NULL');
    const categories = result.rows.map((row, index) => ({ id: index + 1, name: row.name, icon: '🏷️' }));
    res.status(200).json({ success: true, categories: categories.length > 0 ? categories : mockCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

publicCatalogRouter.get('/restaurants', async (req, res) => {
  try {
    // Only return restaurants that are approved AND admin-enabled (is_active = true)
    const result = await pool.query(
      `SELECT * FROM restaurants
       WHERE approval_status = 'approved'
         AND is_active = TRUE
       ORDER BY business_name ASC`
    );
    const restaurants = result.rows.map(r => ({
      id: r.id,
      name: r.business_name,
      type: r.cuisine_type || 'General',
      description: r.description || '',
      rating: r.rating || 0,
      reviews: 0,
      image: r.restaurant_logo_url || 'https://via.placeholder.com/300x200',
      distance: '2.5',
      deliveryTime: '30-45 min',
      cuisines: r.cuisine_type ? [r.cuisine_type] : [],
      address: r.business_address,
      phone: r.owner_phone
    }));
    res.status(200).json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Deleted Rooms endpoint (redirected to restaurants previously)

publicCatalogRouter.get('/food', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, r.business_name as restaurant 
      FROM menu_items m 
      INNER JOIN restaurants r ON m.restaurant_id = r.id
      WHERE r.approval_status = 'approved'
        AND r.is_active = TRUE
    `);
    const foods = result.rows.map(f => ({
      id: f.id,
      name: f.item_name || 'Unnamed Item',
      price: Number(f.price || 0),
      half_price: f.half_price != null ? Number(f.half_price) : null,
      large_price: f.large_price != null ? Number(f.large_price) : null,
      category: f.category || 'Main Course',
      rating: Number(f.rating) || 4.5,
      reviews: 10,
      discount: 0,
      image: f.image_url || 'https://via.placeholder.com/400x400',
      description: f.description || '',
      restaurant: f.restaurant || 'Unknown Restaurant',
      restaurantId: f.restaurant_id,
      is_available: f.is_available,
      daily_stock: f.daily_stock != null ? Number(f.daily_stock) : null,
      current_stock: f.current_stock != null ? Number(f.current_stock) : null,
    }));
    res.status(200).json({ success: true, items: foods, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

publicCatalogRouter.get('/food/:restaurantId', async (req, res) => {
  try {
    const restaurantId = Number.parseInt(req.params.restaurantId, 10);
    // Block access if the restaurant is inactive or not approved
    const restCheck = await pool.query(
      `SELECT id FROM restaurants WHERE id = $1 AND approval_status = 'approved' AND is_active = TRUE`,
      [restaurantId]
    );
    if (restCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found or currently unavailable.' });
    }
    const result = await pool.query(`
      SELECT m.*, r.business_name as restaurant 
      FROM menu_items m 
      INNER JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.restaurant_id = $1
        AND r.approval_status = 'approved'
        AND r.is_active = TRUE
    `, [restaurantId]);
    const foods = result.rows.map(f => ({
      id: f.id,
      name: f.item_name,
      price: Number(f.price || 0),
      half_price: f.half_price != null ? Number(f.half_price) : null,
      large_price: f.large_price != null ? Number(f.large_price) : null,
      category: f.category || 'Main Course',
      rating: Number(f.rating) || 4.5,
      reviews: 10,
      discount: 0,
      image: f.image_url || 'https://via.placeholder.com/400x400',
      description: f.description || '',
      restaurant: f.restaurant,
      restaurantId: f.restaurant_id,
      is_available: f.is_available,
      daily_stock: f.daily_stock != null ? Number(f.daily_stock) : null,
      current_stock: f.current_stock != null ? Number(f.current_stock) : null,
    }));
    res.status(200).json({ success: true, items: foods, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Budget Meal detail endpoint – returns combinations + options for a specific menu item
publicCatalogRouter.get('/food/budget-meal/:menuItemId', async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId, 10);
    // Verify it's a Budget Meal
    const itemRes = await pool.query(
      `SELECT id, item_name, category, image_url, description FROM menu_items WHERE id = $1`,
      [menuItemId]
    );
    if (!itemRes.rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    const item = itemRes.rows[0];
    if (item.category !== 'Budget Meal') {
      return res.status(400).json({ success: false, message: 'Not a budget meal' });
    }
    // Fetch combinations
    const combRes = await pool.query(
      `SELECT id, label, price FROM budget_meal_combinations WHERE menu_item_id = $1 ORDER BY id`,
      [menuItemId]
    );
    const combinations = [];
    for (const combo of combRes.rows) {
      const optsRes = await pool.query(
        `SELECT id, component_type, slot_index, option_name FROM budget_meal_options WHERE combination_id = $1 ORDER BY slot_index, id`,
        [combo.id]
      );
      // Group options by slot_index
      const slots = {};
      for (const opt of optsRes.rows) {
        const key = `${opt.slot_index}_${opt.component_type}`;
        if (!slots[key]) slots[key] = { slot_index: opt.slot_index, component_type: opt.component_type, options: [] };
        slots[key].options.push({ id: opt.id, name: opt.option_name });
      }
      combinations.push({
        id: combo.id,
        label: combo.label,
        price: Number(combo.price),
        slots: Object.values(slots).sort((a, b) => a.slot_index - b.slot_index)
      });
    }
    res.status(200).json({ success: true, menuItem: item, combinations });
  } catch (err) {
    console.error('Budget meal fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use('/api', publicCatalogRouter);

// ==========================================================
// Customer activity endpoints used by the client app
// (cart, favorites, orders, profile).
//
// These are lightweight implementations meant to remove
// "missing route" errors. They store data in the session.
// ==========================================================

const getSessionCart = (req) => {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
};

const getSessionFavorites = (req) => {
  if (!req.session.favorites) req.session.favorites = [];
  return req.session.favorites;
};



// Legacy non-API routes removed to prevent duplication and CORS confusion.
// All client requests should use the /api prefix which is handled below.

// Contact endpoint deleted

// ==========================================
// ==========================================
// CUSTOMER ACTIVITY ENDPOINTS - API PREFIX
// ==========================================

app.get('/api/orders', verifyToken, async (req, res) => {
  const userId = req.userId;
  
  if (dbConnected && userId) {
    try {
      // Get orders from DB
      const ordersResult = await pool.query(`
        SELECT o.*, r.business_name as restaurant_name 
        FROM orders o 
        LEFT JOIN restaurants r ON o.restaurant_id = r.id 
        WHERE o.user_id = $1 
        ORDER BY o.created_at DESC
      `, [userId]);
      
      const orders = ordersResult.rows;
      
      // For each order, get its items
      for (let order of orders) {
        const itemsResult = await pool.query(`
          SELECT oi.*, COALESCE(mi.item_name, 'Unknown Item') as name, mi.image_url 
          FROM order_items oi 
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
          WHERE oi.order_id = $1
        `, [order.id]);
        order.items = itemsResult.rows;
      }
      
      return res.status(200).json({ success: true, orders });
    } catch (err) {
      console.error("Error fetching orders from DB:", err);
      // Fallback below
    }
  }
  
  // Fallback to session if DB not available/connected
  res.status(200).json({ success: true, orders: getSessionOrders(req) });
});

app.post('/api/orders/create', verifyToken, async (req, res) => {
  const { items, subtotal, discount, tax, total, department, course, deliveryAddress, deliveryCity } = req.body || {};
  const userId = req.userId;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const restaurantId = items[0].restaurantId || items[0].restaurant_id || 1;

  if (dbConnected && userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ── Step 1: Validate & deduct stock for each ordered item ──
      for (const item of items) {
        const menuItemId = item.id || item.foodId;
        const qty = Number(item.quantity) || 1;

        // Lock the row to prevent race conditions
        const stockRes = await client.query(
          `SELECT id, item_name, current_stock, daily_stock, is_available
           FROM menu_items WHERE id = $1 FOR UPDATE`,
          [menuItemId]
        );

        if (!stockRes.rows.length) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, message: `Item #${menuItemId} not found` });
        }

        const menuItem = stockRes.rows[0];

        // Check availability
        if (!menuItem.is_available) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: `"${menuItem.item_name}" is currently unavailable` });
        }

        // Check stock (null/negative means unlimited)
        if (menuItem.current_stock !== null && menuItem.current_stock >= 0) {
          if (menuItem.current_stock < qty) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for "${menuItem.item_name}". Only ${menuItem.current_stock} left.`
            });
          }
          // Deduct stock
          await client.query(
            `UPDATE menu_items 
             SET current_stock = GREATEST(current_stock - $1, 0),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [qty, menuItemId]
          );
        }
      }

      // ── Step 2: Create the order ──
      const orderRes = await client.query(
        `INSERT INTO orders (user_id, restaurant_id, order_status, total_amount, delivery_address, delivery_city, department, course) 
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7) RETURNING id, created_at, order_status as status`,
        [userId, restaurantId, total, deliveryAddress || 'University Main Campus', deliveryCity || 'City', department || '', course || '']
      );
      const newOrder = orderRes.rows[0];

      // ── Step 3: Insert order items ──
      for (const item of items) {
        const menuItemId = item.id || item.foodId;
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) 
           VALUES ($1, $2, $3, $4)`,
          [newOrder.id, menuItemId, item.quantity, item.price]
        );
      }

      const itemFoodIds = items.map(i => parseInt(i.id || i.foodId, 10)).filter(id => !isNaN(id));
      if (itemFoodIds.length > 0) {
        await client.query(
          'DELETE FROM cart WHERE user_id = $1 AND menu_item_id = ANY($2::int[])',
          [userId, itemFoodIds]
        );
      }

      await client.query('COMMIT');
      if (req.session.cart) {
        req.session.cart = req.session.cart.filter(c => !itemFoodIds.includes(parseInt(c.foodId, 10)));
      } else {
        req.session.cart = [];
      }
      res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order creation error:', err);
      res.status(500).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  } else {
    // Session fallback
    const order = {
      id: `ORD-${Date.now()}`,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      items: Array.isArray(items) ? items : [],
      subtotal: Number(subtotal ?? 0),
      tax: Number(tax ?? 0),
      total: Number(total ?? 0),
      department: department || '',
      course: course || '',
    };

    const orders = getSessionOrders(req);
    orders.unshift(order);
    
    // session fallback: filter out downloaded items instead of clearing all
    const itemFoodIds = items.map(i => String(i.id || i.foodId));
    if (req.session.cart) {
      req.session.cart = req.session.cart.filter(c => !itemFoodIds.includes(String(c.foodId)));
    } else {
      req.session.cart = [];
    }
    
    res.status(201).json({ success: true, order });
  }
});

// ── Public endpoint to check stock for a specific item ──
app.get('/api/stock/:menuItemId', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const result = await pool.query(
      `SELECT id, item_name, daily_stock, current_stock, is_available FROM menu_items WHERE id = $1`,
      [menuItemId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    const item = result.rows[0];
    res.status(200).json({
      success: true,
      id: item.id,
      item_name: item.item_name,
      daily_stock: item.daily_stock,
      current_stock: item.current_stock,
      is_available: item.is_available,
      in_stock: item.current_stock === null || item.current_stock < 0 || item.current_stock > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/cart/add', verifyToken, async (req, res) => {
  const { foodId, quantity, size, budgetMeal } = req.body || {};
  const userId = req.userId;
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const qty = Math.max(1, Number(quantity ?? 1));

  if (dbConnected && userId) {
    try {
      // Find restaurant_id for the item
      const itemRes = await pool.query('SELECT restaurant_id FROM menu_items WHERE id = $1', [foodId]);
      if (itemRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
      const restaurantId = itemRes.rows[0].restaurant_id;

      // Check if already in DB cart
      const existing = await pool.query(
        'SELECT id, quantity FROM cart WHERE user_id = $1 AND menu_item_id = $2 AND (size = $3 OR (size IS NULL AND $3 IS NULL))',
        [userId, foodId, size || null]
      );

      if (existing.rows.length > 0) {
        await pool.query('UPDATE cart SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [qty, existing.rows[0].id]);
      } else {
        await pool.query(
          'INSERT INTO cart (user_id, restaurant_id, menu_item_id, quantity, size) VALUES ($1, $2, $3, $4, $5)',
          [userId, restaurantId, foodId, qty, size || null]
        );
      }
      return res.status(200).json({ success: true, message: 'Added to cart in DB' });
    } catch (err) {
      console.error("DB Cart Add Error:", err.message);
    }
  }

  // Session fallback
  const cart = getSessionCart(req);
  const comboId = budgetMeal?.combinationId ?? null;
  const existing = cart.find((i) => {
    if (String(i.foodId) !== String(foodId)) return false;
    if (comboId != null) return i.budgetMeal?.combinationId === comboId;
    return i.size === size;
  });
  if (existing) {
    existing.quantity += qty;
    if (budgetMeal) existing.budgetMeal = budgetMeal;
  } else {
    cart.push({ foodId, quantity: qty, size: size || null, budgetMeal: budgetMeal || null });
  }

  res.status(200).json({ success: true, cart });
});

app.post('/api/cart/remove', verifyToken, async (req, res) => {
  const { foodId, size, budgetMealComboId } = req.body || {};
  const userId = req.userId;
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  if (dbConnected && userId) {
    try {
      await pool.query(
        'DELETE FROM cart WHERE user_id = $1 AND menu_item_id = $2 AND (size = $3 OR (size IS NULL AND $3 IS NULL))',
        [userId, foodId, size || null]
      );
      return res.status(200).json({ success: true, message: 'Removed from DB cart' });
    } catch (err) {
      console.error("DB Cart Remove Error:", err.message);
    }
  }

  const cart = getSessionCart(req);
  req.session.cart = cart.filter((i) => {
    if (String(i.foodId) !== String(foodId)) return true; // keep different items
    if (budgetMealComboId != null) return i.budgetMeal?.combinationId !== budgetMealComboId;
    return i.size !== size;
  });
  res.status(200).json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/update', verifyToken, async (req, res) => {
  const { foodId, quantity, size, budgetMealComboId } = req.body || {};
  const userId = req.userId;
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const qty = Number(quantity ?? 1);

  if (dbConnected && userId) {
    try {
      if (qty <= 0) {
        await pool.query(
          'DELETE FROM cart WHERE user_id = $1 AND menu_item_id = $2 AND (size = $3 OR (size IS NULL AND $3 IS NULL))',
          [userId, foodId, size || null]
        );
      } else {
        await pool.query(
          'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND menu_item_id = $3 AND (size = $4 OR (size IS NULL AND $4 IS NULL))',
          [qty, userId, foodId, size || null]
        );
      }
      return res.status(200).json({ success: true, message: 'Updated in DB cart' });
    } catch (err) {
      console.error("DB Cart Update Error:", err.message);
    }
  }

  const cart = getSessionCart(req);
  const findItem = (i) => {
    if (String(i.foodId) !== String(foodId)) return false;
    if (budgetMealComboId != null) return i.budgetMeal?.combinationId === budgetMealComboId;
    return i.size === size;
  };

  if (qty <= 0) {
    req.session.cart = cart.filter((i) => !findItem(i));
    return res.status(200).json({ success: true, cart: req.session.cart });
  }

  const existing = cart.find(findItem);
  if (existing) {
    existing.quantity = qty;
  } else {
    cart.push({ foodId, quantity: qty, size: size || null });
  }

  res.status(200).json({ success: true, cart });
});

app.get('/api/cart', verifyToken, async (req, res) => {
  const userId = req.userId;
  let itemsToHydrate = req.session.cart || [];

  if (dbConnected && userId) {
    try {
      const dbCartRes = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
      if (dbCartRes.rows.length > 0) {
        // Convert DB format to session format for the hydration logic below
        itemsToHydrate = dbCartRes.rows.map(r => ({
          foodId: r.menu_item_id,
          quantity: r.quantity,
          size: r.size,
          budgetMeal: null // Add budgetMeal support if needed
        }));
      }
    } catch (err) {
      console.error("DB Cart Fetch Error:", err.message);
    }
  }

  if (dbConnected) {
    try {
      if (itemsToHydrate.length === 0) {
        return res.status(200).json({ success: true, cart: [] });
      }

      // Map session items to IDs for querying
      const ids = itemsToHydrate.map(i => i.foodId);
      const result = await pool.query(`
        SELECT m.*, r.business_name as restaurant 
        FROM menu_items m 
        LEFT JOIN restaurants r ON m.restaurant_id = r.id 
        WHERE m.id = ANY($1)
      `, [ids]);
      
      const dbItems = new Map();
      result.rows.forEach(row => dbItems.set(String(row.id), row));

      const hydratedCart = itemsToHydrate.map(sItem => {
        const row = dbItems.get(String(sItem.foodId));
        if (!row) return null;

        // Resolve price based on size
        let finalPrice = Number(row.price);
        let finalName = row.item_name || row.name || 'Delicious Meal';

        if (sItem.size === 'Small' && row.half_price) {
          finalPrice = Number(row.half_price);
          finalName += ' (Small)';
        } else if (sItem.size === 'Large' && row.large_price) {
          finalPrice = Number(row.large_price);
          finalName += ' (Large)';
        } else if (sItem.size === 'Medium') {
          finalName += ' (Medium)';
        }

        return {
          id: sItem.size ? `${row.id}-${sItem.size}` : sItem.budgetMeal ? `${row.id}-bm-${sItem.budgetMeal.combinationId}` : row.id,
          foodId: row.id,
          name: finalName,
          price: isNaN(finalPrice) ? 0 : finalPrice,
          image: row.image_url || row.image || 'https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80',
          description: row.description || "Freshly made with premium ingredients.",
          restaurant: row.restaurant || row.business_name || 'BiteHub Partner',
          restaurant_id: row.restaurant_id,
          quantity: sItem.quantity,
          size: sItem.size,
          budgetMeal: sItem.budgetMeal || null,
          category: row.category
        };
      }).filter(i => i !== null);
      
      res.status(200).json({ success: true, cart: hydratedCart });
    } catch (err) {
      console.error("Cart hydration error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  } else {
    // Session fallback: mockFoodItems is a keyed object { 1: [...], 2: [...] }
    const allMockFoods = Object.values(mockFoodItems).flat();
    const mockHydrated = itemsToHydrate
      .map(i => {
        const item = allMockFoods.find(mi => String(mi.id) === String(i.foodId));
        if (!item) return null;

        let finalPrice = item.price || 0;
        let finalName = item.name;

        if (i.size === 'Small' && item.half_price) {
          finalPrice = item.half_price;
          finalName += ' (Small)';
        } else if (i.size === 'Large' && item.large_price) {
          finalPrice = item.large_price;
          finalName += ' (Large)';
        } else if (i.size === 'Medium') {
          finalName += ' (Medium)';
        }

        return { 
          id: i.size ? `${item.id}-${i.size}` : item.id,
          foodId: item.id,
          name: finalName,
          price: finalPrice,
          image: item.image || 'https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80',
          description: item.description || 'Freshly made with premium ingredients.',
          restaurant: item.restaurant || 'BiteHub Partner',
          quantity: i.quantity,
          size: i.size
        };
      })
      .filter(item => item !== null);
    res.status(200).json({ success: true, cart: mockHydrated });
  }
});

app.post('/api/favorites/toggle', verifyToken, async (req, res) => {
  const { foodId } = req.body || {};
  const userId = req.userId;
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  if (dbConnected && userId) {
    try {
      const existing = await pool.query('SELECT id FROM favorites WHERE user_id = $1 AND menu_item_id = $2', [userId, foodId]);
      if (existing.rows.length > 0) {
        await pool.query('DELETE FROM favorites WHERE id = $1', [existing.rows[0].id]);
        return res.status(200).json({ success: true, isFavorite: false });
      } else {
        await pool.query('INSERT INTO favorites (user_id, menu_item_id) VALUES ($1, $2)', [userId, foodId]);
        return res.status(200).json({ success: true, isFavorite: true });
      }
    } catch (err) {
      console.error("DB Favorites Sync Error:", err.message);
    }
  }

  // Fallback
  const favorites = getSessionFavorites(req);
  const idx = favorites.indexOf(foodId);
  const isFavorite = idx === -1;
  if (isFavorite) favorites.push(foodId);
  else favorites.splice(idx, 1);

  res.status(200).json({ success: true, isFavorite, favorites });
});

app.get('/api/profile', verifyToken, async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  if (dbConnected) {
    try {
      const result = await pool.query('SELECT id, full_name, email, phone, address, city, department, course, year FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        // Synch session profile for legacy reasons if needed, but return DB data
        res.status(200).json({ 
          success: true, 
          profile: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            address: user.address || '',
            city: user.city || '',
            phone: user.phone || '',
            department: user.department || '',
            course: user.course || '',
            year: user.year || ''
          } 
        });
        return;
      }
    } catch(err) {
      console.error("Profile fetch error:", err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching profile' });
    }
  }

  // Fallback if DB not connected (using session or mock)
  res.status(200).json({ success: true, profile: req.session.profile || {} });
});

app.put('/api/profile', verifyToken, async (req, res) => {
  const { address, city, phone, department, course, year } = req.body || {};
  const userId = req.userId;
  
  if (dbConnected && userId) {
    try {
      await pool.query(
        'UPDATE users SET address=$1, city=$2, phone=$3, department=$4, course=$5, year=$6 WHERE id=$7', 
        [
          address || null,
          city || null,
          phone || null,
          department || null,
          course || null,
          year || null,
          userId
        ]
      );
      
      // Update session if it exists (though withCredentials may be false)
      if (req.session.profile) {
        req.session.profile = { ...req.session.profile, address, city, phone, department, course, year };
      }
      
      return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
      console.error("Profile update error:", err.message);
      return res.status(500).json({ success: false, message: 'Error updating profile in database' });
    }
  }

  // Fallback if DB not connected
  if (req.session.profile) {
    req.session.profile = { ...req.session.profile, address, city, phone, department, course, year };
  }
  res.status(200).json({ success: true, profile: req.session.profile });
});

app.post('/api/customer/register', async (req, res) => {
  const { full_name, email, phone, address, city, department, course, year, password } = req.body;
  
  console.log("Incoming Register Request:", req.body);
  if (!full_name || !email || !password) {
    console.log("Failed validation: full_name:", full_name, "email:", email, "password exists:", !!password);
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR full_name = $2', [email, full_name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email or name already exists' });
    }

    const hashed = await hashPassword(password);
    
    const newUserResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, address, city, department, course, year, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, full_name, email`,
      [full_name, email, phone, address, city, department, course, year, hashed]
    );

    const newUser = newUserResult.rows[0];

    // Issue JWT Token for direct login after registration (minimal payload as requested)
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'super-secret-key-123',
      { expiresIn: '7d' }
    );

    console.log(`[REGISTER] Token generated for ${newUser.email}`);
    res.json({ success: true, message: 'Registration successful', token });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/login', async (req, res) => {
  const { fullName, password } = req.body;
  if (!fullName || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE full_name = $1', [fullName]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    req.session.userId = user.id;
    req.session.profile = {
      full_name: user.full_name,
      email: user.email,
      address: user.address || '',
      city: user.city || '',
      phone: user.phone || '',
      department: user.department || '',
      course: user.course || '',
      year: user.year || ''
    };

    // Issue JWT Token for localStorage storage (minimal payload as requested)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'super-secret-key-123',
      { expiresIn: '7d' }
    );

    console.log(`[LOGIN] User ${user.email} logged in. Token issued.`);
    res.json({ success: true, profile: req.session.profile, token });
  } catch (err) {
    console.error("[LOGIN] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/logout', (req, res) => {
  req.session.destroy();
  // Frontend should clear localStorage.authToken
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// ROOT & ERROR HANDLING
// ==========================================

app.get('/', (req, res) => {
  res.json({ message: 'BiteHub API Server', version: '1.0.0', status: 'running' });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}); 

// Match Vite dev (client/package.json): large Cookie / credentialed proxy requests can exceed Node's default header limit (431).
const MAX_HTTP_HEADER_SIZE = 262144;
const server = http.createServer({ maxHeaderSize: MAX_HTTP_HEADER_SIZE }, app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${PORT} (maxHeaderSize=${MAX_HTTP_HEADER_SIZE})`);
  console.log(`👉 Access via Vite proxy on http://localhost:5173`);
});

