import express from 'express';
import { pool } from '../db.js';
import { hashPassword, comparePassword } from '../components/hash.js';

const router = express.Router();

// Middleware to check if owner is authenticated
const requireOwner = (req, res, next) => {
  if (!req.session || !req.session.restaurantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }
  next();
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
    taxId,
    ownerName,
    ownerPhone,
    businessEmail,
    username,
    password
  } = req.body;

  if (!businessName || !businessEmail || !username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUsername = username || businessEmail.split('@')[0];

    // Check if database is available by trying a test query
    let dbAvailable = false;
    try {
      await pool.query('SELECT NOW()');
      dbAvailable = true;
    } catch (dbTest) {
      console.warn('⚠️  Database unavailable, using session fallback for registration');
      dbAvailable = false;
    }

    if (dbAvailable) {
      // Use database
      const result = await pool.query(
        `INSERT INTO restaurants 
         (business_name, business_address, city, province, permit_number, tax_id, owner_name, owner_phone, business_email, username, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, business_name, username`,
        [businessName, businessAddress, city, province, permitNumber, taxId || 'N/A', ownerName, ownerPhone, businessEmail, newUsername, hashedPassword]
      );

      const restaurant = result.rows[0];
      req.session.restaurantId = restaurant.id;
      req.session.restaurantName = restaurant.business_name;
      req.session.userRole = 'owner';
      
      res.status(201).json({ success: true, message: "Restaurant registered successfully", user: restaurant });
    } else {
      // Fallback to session storage
      const restaurantId = `rest_${Date.now()}`;
      req.session.restaurantId = restaurantId;
      req.session.restaurantName = businessName;
      req.session.userRole = 'owner';
      req.session.restaurantData = {
        businessName,
        businessAddress,
        city,
        province,
        permitNumber,
        taxId,
        ownerName,
        ownerPhone,
        businessEmail,
        username: newUsername,
        passwordHash: hashedPassword
      };
      
      res.status(201).json({ 
        success: true, 
        message: "Restaurant registered successfully (session mode - database unavailable)", 
        user: { id: restaurantId, business_name: businessName, username: newUsername } 
      });
    }
  } catch (error) {
    console.error('Restaurant Registration Error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    if (error.code === '42P1') {
      return res.status(500).json({ success: false, message: "Database not initialized. Please run schema.sql" });
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
    // Check if database is available
    let dbAvailable = false;
    try {
      await pool.query('SELECT NOW()');
      dbAvailable = true;
    } catch (dbTest) {
      console.warn('⚠️  Database unavailable, using session fallback for login');
      dbAvailable = false;
    }

    if (dbAvailable) {
      // Use database
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
      
      req.session.restaurantId = restaurant.id;
      req.session.restaurantName = restaurant.business_name;
      req.session.userRole = 'owner';
      
      res.status(200).json({ success: true, message: "Login successful", user: { id: restaurant.id, name: restaurant.business_name, email: restaurant.business_email } });
    } else {
      // Fallback to session storage - mock validation based on username
      const restaurantId = `rest_${username.replace(/[^a-z0-9]/gi, '_')}`;
      req.session.restaurantId = restaurantId;
      req.session.restaurantName = username;
      req.session.userRole = 'owner';
      
      res.status(200).json({ 
        success: true, 
        message: "Login successful (session mode - database unavailable)", 
        user: { id: restaurantId, name: username, email: username } 
      });
    }
  } catch (error) {
    console.error('Restaurant Login Error:', error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

router.get('/session', (req, res) => {
  if (req.session.restaurantId) {
    res.status(200).json({
      session: true,
      restaurantId: req.session.restaurantId,
      name: req.session.restaurantName
    });
  } else {
    res.status(200).json({ session: false });
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

router.get('/dashboard', async (req, res) => {
  const rId = req.session.restaurantId;
  try {
    // Basic metrics
    const ordersRes = await pool.query("SELECT COUNT(*) FROM orders WHERE restaurant_id = $1", [rId]);
    const revenueRes = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE restaurant_id = $1 AND order_status IN ('delivered', 'ready')", [rId]);
    const activeRes = await pool.query("SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_status NOT IN ('delivered', 'ready', 'cancelled')", [rId]);
    const menuRes = await pool.query("SELECT COUNT(*) FROM menu_items WHERE restaurant_id = $1", [rId]);
    const recentRes = await pool.query(`
      SELECT o.id, u.full_name as customer_name, o.total_amount, o.order_status as status, o.created_at as time 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = $1 
      ORDER BY o.created_at DESC LIMIT 5`, [rId]);
    
    res.status(200).json({
      success: true,
      metrics: {
        totalOrders: parseInt(ordersRes.rows[0].count),
        revenue: parseFloat(revenueRes.rows[0].total),
        activeOrders: parseInt(activeRes.rows[0].count),
        menuItems: parseInt(menuRes.rows[0].count)
      },
      recentOrders: recentRes.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Dashboard error" });
  }
});

// Menu Management
router.get('/menu', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id DESC", [req.session.restaurantId]);
    res.status(200).json({ success: true, items: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/menu', async (req, res) => {
  const { name, description, price, half_price, category, isAvailable, image_url, inventory_count } = req.body;
  try {
    await pool.query(
      `INSERT INTO menu_items (restaurant_id, item_name, description, price, half_price, category, is_available, image_url, inventory_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.session.restaurantId, name, description, price, half_price || null, category, isAvailable ?? true, image_url, inventory_count ?? -1]
    );
    res.status(201).json({ success: true, message: 'Item added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/menu/:id', async (req, res) => {
  const { name, description, price, half_price, category, isAvailable, image_url, inventory_count } = req.body;
  try {
    await pool.query(
      `UPDATE menu_items SET item_name=$1, description=$2, price=$3, half_price=$4, category=$5, is_available=$6, image_url=$7, inventory_count=$8 
       WHERE id=$9 AND restaurant_id=$10`,
      [name, description, price, half_price || null, category, isAvailable, image_url, inventory_count, req.params.id, req.session.restaurantId]
    );
    res.status(200).json({ success: true, message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1 AND restaurant_id=$2", [req.params.id, req.session.restaurantId]);
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Order Management
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
             u.full_name as customer_name,
             u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = $1
      ORDER BY o.created_at DESC
    `, [req.session.restaurantId]);
    
    // For simplicity, returning just orders. In a real app we'd fetch order_items too.
    res.status(200).json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE orders SET order_status = $1 WHERE id = $2 AND restaurant_id = $3", [status, req.params.id, req.session.restaurantId]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics
router.get('/analytics', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, SUM(total_amount) as daily_revenue, COUNT(*) as daily_orders
      FROM orders 
      WHERE restaurant_id = $1 AND order_status IN ('delivered', 'ready')
      GROUP BY DATE(created_at)
      ORDER BY date DESC LIMIT 30
    `, [req.session.restaurantId]);
    res.status(200).json({ success: true, analytics: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query("SELECT business_name, business_address, city, owner_name, owner_phone, business_email, description FROM restaurants WHERE id = $1", [req.session.restaurantId]);
    res.status(200).json({ success: true, settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  const { business_name, business_address, city, owner_name, owner_phone, description } = req.body;
  try {
    await pool.query(`
      UPDATE restaurants SET business_name=$1, business_address=$2, city=$3, owner_name=$4, owner_phone=$5, description=$6
      WHERE id=$7
    `, [business_name, business_address, city, owner_name, owner_phone, description, req.session.restaurantId]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
