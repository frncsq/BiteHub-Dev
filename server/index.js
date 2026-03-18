import express from 'express';
import session from 'express-session';
import { pool } from './db.js';
import cors from 'cors';
import { hashPassword, comparePassword } from './components/hash.js';
import { mockRestaurantsData, mockFoodItems, mockCategories } from './mockData.js';
import ownerRoutes from './routes/owner.js';

const app = express();
app.use(express.json());

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://qntinita-to-do-list-git-main-rises-projects-b13889a1.vercel.app',
    'https://qntinita-to-do-list-dzay7f8xu-rises-projects-b13889a1.vercel.app',
    'https://qntinita-to-do-list.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

const PORT = process.env.PORT || 5000;

app.get('/categories', (req, res) => {
  res.status(200).json({ success: true, categories: mockCategories });
});

app.get('/restaurants', (req, res) => {
  res.status(200).json({ success: true, restaurants: mockRestaurantsData });
});

app.get('/rooms', (req, res) => {
  res.status(200).json({ success: true, rooms: mockRestaurantsData });
});

app.get('/food/:restaurantId', (req, res) => {
  const restaurantId = parseInt(req.params.restaurantId);
  const foods = mockFoodItems[restaurantId] || [];
  res.status(200).json({ success: true, items: foods, foods });
});

app.post('/register', async (req, res) => {
  const {username, password, confirm, name } = req.body;
  if(password === confirm ){
    try {
      const hashedPassword = await hashPassword(password);
      await pool.query(
        "INSERT INTO user_accounts (username, password, name) VALUES ($1, $2, $3)", [username, hashedPassword, name]
      );
      res.status(200).json({ success: true, message: "Registered successfully"});
    } catch (error) {
      res.status(500).json({ success: false, message: "Error registering user" });
    }
  } else {
    res.status(401).json({ success: false, message: "Passwords do not match" });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM user_accounts WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    res.status(200).json({ success: true, message: "Login successful", user: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get('/get-session', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({
      session: true,
      userId: req.session.userId,
      name: req.session.name
    });
  } else {
    res.status(200).json({ session: false });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to Express');
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: "Error logging out" });
    } else {
      res.status(200).json({ success: true, message: "Logged out successfully" });
    }
  });
}); 

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

