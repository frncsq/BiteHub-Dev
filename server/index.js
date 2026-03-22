import express from 'express';
import session from 'express-session';
import { pool } from './db.js';
import cors from 'cors';
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
    await seedDatabase();
    // Start daily stock reset scheduler after DB is confirmed available
    scheduleDailyStockReset();
  } catch (err) {
    dbConnected = false;
    console.log('⚠️  Database not available, using session storage for auth');
  }
})();

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(session({
  secret: '1234567890', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);

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
    const result = await pool.query('SELECT * FROM restaurants');
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

publicCatalogRouter.get('/rooms', async (req, res) => {
  res.redirect('/api/restaurants');
});

publicCatalogRouter.get('/food', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, r.business_name as restaurant 
      FROM menu_items m 
      LEFT JOIN restaurants r ON m.restaurant_id = r.id
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
    const result = await pool.query(`
      SELECT m.*, r.business_name as restaurant 
      FROM menu_items m 
      LEFT JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.restaurant_id = $1
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

app.use(publicCatalogRouter);
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



app.post('/orders/create', async (req, res) => {
  // Redirect legacy endpoint to the main one
  req.url = '/api/orders/create';
  // Forward to same handler by just re-calling the logic inline:
  const { items, subtotal, tax, deliveryFee, total, deliveryAddress, deliveryCity } = req.body || {};
  const userId = req.session.userId;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const restaurantId = items[0].restaurantId || 1;

  if (dbConnected && userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        const menuItemId = item.id || item.foodId;
        const qty = Number(item.quantity) || 1;
        const stockRes = await client.query(
          `SELECT id, item_name, current_stock, is_available FROM menu_items WHERE id = $1 FOR UPDATE`,
          [menuItemId]
        );
        if (stockRes.rows.length) {
          const mi = stockRes.rows[0];
          if (!mi.is_available) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `"${mi.item_name}" is currently unavailable` });
          }
          if (mi.current_stock !== null && mi.current_stock >= 0 && mi.current_stock < qty) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `Insufficient stock for "${mi.item_name}". Only ${mi.current_stock} left.` });
          }
          if (mi.current_stock !== null && mi.current_stock >= 0) {
            await client.query(`UPDATE menu_items SET current_stock = GREATEST(current_stock - $1, 0), updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [qty, menuItemId]);
          }
        }
      }
      const orderRes = await client.query(
        `INSERT INTO orders (user_id, restaurant_id, order_status, total_amount, delivery_address, delivery_city) 
         VALUES ($1, $2, 'pending', $3, $4, $5) RETURNING id, created_at, order_status as status`,
        [userId, restaurantId, total, deliveryAddress || req.session.profile?.address || '123 Main St', deliveryCity || req.session.profile?.city || 'City']
      );
      const newOrder = orderRes.rows[0];
      for (const item of items) {
        await client.query(`INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES ($1, $2, $3, $4)`,
          [newOrder.id, item.id, item.quantity, item.price]);
      }
      await client.query('COMMIT');
      req.session.cart = [];
      res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order creation error:', err);
      res.status(500).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  } else {
    const order = {
      id: `ORD-${Date.now()}`,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      items: Array.isArray(items) ? items : [],
      subtotal: Number(subtotal ?? 0),
      tax: Number(tax ?? 0),
      deliveryFee: Number(deliveryFee ?? 0),
      total: Number(total ?? 0),
    };
    const orders = getSessionOrders(req);
    orders.unshift(order);
    req.session.cart = [];
    res.status(201).json({ success: true, order });
  }
});

app.post('/cart/add', (req, res) => {
  const { foodId, quantity } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  const qty = Math.max(1, Number(quantity ?? 1));
  const existing = cart.find((i) => i.foodId === foodId);
  if (existing) existing.quantity += qty;
  else cart.push({ foodId, quantity: qty });

  res.status(200).json({ success: true, cart });
});

app.post('/cart/remove', (req, res) => {
  const { foodId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  req.session.cart = cart.filter((i) => i.foodId !== foodId);
  res.status(200).json({ success: true, cart: req.session.cart });
});

app.post('/cart/update', (req, res) => {
  const { foodId, quantity } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  const qty = Number(quantity ?? 1);
  if (qty <= 0) {
    req.session.cart = cart.filter((i) => i.foodId !== foodId);
    return res.status(200).json({ success: true, cart: req.session.cart });
  }

  const existing = cart.find((i) => i.foodId === foodId);
  if (existing) existing.quantity = qty;
  else cart.push({ foodId, quantity: qty });

  res.status(200).json({ success: true, cart });
});

app.post('/favorites/toggle', (req, res) => {
  const { foodId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const favorites = getSessionFavorites(req);
  const idx = favorites.indexOf(foodId);
  const isFavorite = idx === -1;
  if (isFavorite) favorites.push(foodId);
  else favorites.splice(idx, 1);

  res.status(200).json({ success: true, isFavorite, favorites });
});

app.put('/api/profile', (req, res) => {
  const nextProfile = req.body || {};
  req.session.profile = { ...(req.session.profile || {}), ...nextProfile };
  res.status(200).json({ success: true, profile: req.session.profile });
});

// ==========================================
// CONTACT ENDPOINT
// ==========================================

app.post('/api/contact/submit', async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, status) 
       VALUES ($1, $2, $3, $4, $5, 'new') RETURNING id, created_at`,
      [name, email, phone || null, subject, message]
    );

    const contact = result.rows[0];
    res.status(201).json({ 
      success: true, 
      message: "Thank you! We'll get back to you soon.",
      contactId: contact.id 
    });
  } catch (error) {
    console.error('Contact Error:', error);
    res.status(500).json({ success: false, message: "Error submitting contact form" });
  }
});

// ==========================================
// ==========================================
// CUSTOMER ACTIVITY ENDPOINTS - API PREFIX
// ==========================================

app.get('/api/orders', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    if (req.session.orders) return res.status(200).json({ success: true, orders: req.session.orders });
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  
  try {
    // Get orders with a fallback for restaurant name
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
    
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(200).json({ success: true, orders: getSessionOrders(req) });
  }
});

app.post('/api/orders/create', async (req, res) => {
  const { items, subtotal, discount, tax, total, department, course } = req.body || {};
  const userId = req.session.userId;
  
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
        [userId, restaurantId, total, req.session.profile?.address || '123 Main St', req.session.profile?.city || 'City', department || '', course || '']
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

      await client.query('COMMIT');
      req.session.cart = [];
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
    req.session.cart = [];
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

app.post('/api/cart/add', (req, res) => {
  const { foodId, quantity, size, budgetMeal } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  const qty = Math.max(1, Number(quantity ?? 1));
  
  // Unique key: for budget meals use combinationId, for drinks use size
  const comboId = budgetMeal?.combinationId ?? null;
  const existing = cart.find((i) => {
    if (String(i.foodId) !== String(foodId)) return false;
    if (comboId != null) return i.budgetMeal?.combinationId === comboId;
    return i.size === size;
  });
  if (existing) {
    existing.quantity += qty;
    // Update selection if re-added (allows changing options via re-add)
    if (budgetMeal) existing.budgetMeal = budgetMeal;
  } else {
    cart.push({ foodId, quantity: qty, size: size || null, budgetMeal: budgetMeal || null });
  }

  res.status(200).json({ success: true, cart });
});

app.post('/api/cart/remove', (req, res) => {
  const { foodId, size, budgetMealComboId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  req.session.cart = cart.filter((i) => {
    if (String(i.foodId) !== String(foodId)) return true; // keep different items
    if (budgetMealComboId != null) return i.budgetMeal?.combinationId !== budgetMealComboId;
    return i.size !== size;
  });
  res.status(200).json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/update', (req, res) => {
  const { foodId, quantity, size, budgetMealComboId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  const qty = Number(quantity ?? 1);
  
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

app.get('/api/cart', async (req, res) => {
  const sessionCart = getSessionCart(req);
  if (dbConnected) {
    try {
      if (sessionCart.length === 0) {
        return res.status(200).json({ success: true, cart: [] });
      }

      // Map session items to IDs for querying
      const ids = sessionCart.map(i => i.foodId);
      const result = await pool.query(`
        SELECT m.*, r.business_name as restaurant 
        FROM menu_items m 
        LEFT JOIN restaurants r ON m.restaurant_id = r.id 
        WHERE m.id = ANY($1)
      `, [ids]);
      
      const dbItems = new Map();
      result.rows.forEach(row => dbItems.set(String(row.id), row));

      const hydratedCart = sessionCart.map(sItem => {
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
    const mockHydrated = sessionCart
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

app.post('/api/favorites/toggle', (req, res) => {
  const { foodId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const favorites = getSessionFavorites(req);
  const idx = favorites.indexOf(foodId);
  const isFavorite = idx === -1;
  if (isFavorite) favorites.push(foodId);
  else favorites.splice(idx, 1);

  res.status(200).json({ success: true, isFavorite, favorites });
});

app.get('/api/profile', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(200).json({ success: true, profile: req.session.profile || {} });
  
  if (dbConnected) {
    try {
      const result = await pool.query('SELECT full_name, email, phone, address, city, department, course, year FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
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
      }
    } catch(err) {
      console.error("Profile fetch error:", err.message);
    }
  }

  res.status(200).json({ success: true, profile: req.session.profile || {} });
});

app.put('/api/profile', async (req, res) => {
  const nextProfile = req.body || {};
  req.session.profile = { ...(req.session.profile || {}), ...nextProfile };
  const userId = req.session.userId;
  
  if (dbConnected && userId) {
    try {
      await pool.query(
        'UPDATE users SET address=$1, city=$2, phone=$3, department=$4, course=$5, year=$6 WHERE id=$7', 
        [
          req.session.profile.address || null,
          req.session.profile.city || null,
          req.session.profile.phone || null,
          req.session.profile.department || null,
          req.session.profile.course || null,
          req.session.profile.year || null,
          userId
        ]
      );
    } catch (err) {
      console.error("Profile update error:", err.message);
    }
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
    
    await pool.query(
      `INSERT INTO users (full_name, email, phone, address, city, department, course, year, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [full_name, email, phone, address, city, department, course, year, hashed]
    );

    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
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
    res.json({ success: true, profile: req.session.profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

