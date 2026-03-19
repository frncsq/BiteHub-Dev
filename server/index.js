import express from 'express';
import session from 'express-session';
import { pool } from './db.js';
import cors from 'cors';
import { hashPassword, comparePassword } from './components/hash.js';
import { mockRestaurantsData, mockFoodItems, mockCategories } from './mockData.js';
import ownerRoutes from './routes/owner.js';

// Database connection test flag
let dbConnected = false;
pool.query('SELECT NOW()').then(() => {
  dbConnected = true;
  console.log('✅ Database connected');
}).catch(err => {
  dbConnected = false;
  console.log('⚠️  Database not available, using session storage for auth');
});

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

const PORT = process.env.PORT || 5001;

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
      name: f.item_name,
      price: Number(f.price),
      rating: Number(f.rating) || 4.5,
      reviews: 10,
      discount: 0,
      image: f.image_url || 'https://via.placeholder.com/400x400',
      restaurant: f.restaurant,
      restaurantId: f.restaurant_id
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
      price: Number(f.price),
      rating: Number(f.rating) || 4.5,
      reviews: 10,
      discount: 0,
      image: f.image_url || 'https://via.placeholder.com/400x400',
      restaurant: f.restaurant,
      restaurantId: f.restaurant_id
    }));
    res.status(200).json({ success: true, items: foods, foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

const getSessionOrders = (req) => {
  if (!req.session.orders) req.session.orders = [];
  return req.session.orders;
};

app.get('/orders', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ success: false, message: 'Not logged in' });
  
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json({ success: true, orders: result.rows });
  } catch (err) {
    // Session fallback if table not available or error
    res.status(200).json({ success: true, orders: getSessionOrders(req) });
  }
});

app.post('/orders/create', async (req, res) => {
  const { items, subtotal, tax, deliveryFee, total, deliveryAddress, deliveryCity } = req.body || {};
  const userId = req.session.userId;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Get restaurant_id from the first item
  const restaurantId = items[0].restaurantId || 1; // Fallback to 1 if missing

  if (dbConnected && userId) {
    try {
      // Insert into orders table
      const orderRes = await pool.query(
        `INSERT INTO orders (user_id, restaurant_id, order_status, total_amount, delivery_address, delivery_city) 
         VALUES ($1, $2, 'pending', $3, $4, $5) RETURNING id, created_at, order_status as status`,
        [userId, restaurantId, total, deliveryAddress || req.session.profile?.address || '123 Main St', deliveryCity || req.session.profile?.city || 'City']
      );
      const newOrder = orderRes.rows[0];

      // Insert order items
      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) 
           VALUES ($1, $2, $3, $4)`,
          [newOrder.id, item.id, item.quantity, item.price]
        );
      }
      
      req.session.cart = [];
      res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      console.error('Order creation error:', err);
      res.status(500).json({ success: false, message: err.message });
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
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(200).json({ success: true, orders: getSessionOrders(req) });
  }
});

app.post('/api/orders/create', async (req, res) => {
  const { items, subtotal, tax, deliveryFee, total } = req.body || {};
  const userId = req.session.userId;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const restaurantId = items[0].restaurantId || 1;

  if (dbConnected && userId) {
    try {
      const orderRes = await pool.query(
        `INSERT INTO orders (user_id, restaurant_id, order_status, total_amount, delivery_address, delivery_city) 
         VALUES ($1, $2, 'pending', $3, $4, $5) RETURNING id, created_at, order_status as status`,
        [userId, restaurantId, total, req.session.profile?.address || '123 Main St', req.session.profile?.city || 'City']
      );
      const newOrder = orderRes.rows[0];

      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) 
           VALUES ($1, $2, $3, $4)`,
          [newOrder.id, item.id, item.quantity, item.price]
        );
      }
      
      req.session.cart = [];
      res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      console.error('Order creation error:', err);
      res.status(500).json({ success: false, message: err.message });
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
      deliveryFee: Number(deliveryFee ?? 0),
      total: Number(total ?? 0),
    };

    const orders = getSessionOrders(req);
    orders.unshift(order);
    req.session.cart = [];
    res.status(201).json({ success: true, order });
  }
});

app.post('/api/cart/add', (req, res) => {
  const { foodId, quantity } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  const qty = Math.max(1, Number(quantity ?? 1));
  const existing = cart.find((i) => i.foodId === foodId);
  if (existing) existing.quantity += qty;
  else cart.push({ foodId, quantity: qty });

  res.status(200).json({ success: true, cart });
});

app.post('/api/cart/remove', (req, res) => {
  const { foodId } = req.body || {};
  if (!foodId) return res.status(400).json({ success: false, message: 'foodId is required' });

  const cart = getSessionCart(req);
  req.session.cart = cart.filter((i) => i.foodId !== foodId);
  res.status(200).json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/update', (req, res) => {
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

app.get('/api/cart', (req, res) => {
  res.status(200).json({ success: true, cart: getSessionCart(req) });
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
        'UPDATE users SET address=$1, city=$2, phone=$3 WHERE id=$4', 
        [req.session.profile.address || null, req.session.profile.city || null, req.session.profile.phone || null, userId]
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
      phone: user.phone || ''
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

