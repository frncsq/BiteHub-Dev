import express from 'express';
import session from 'express-session';
import { pool } from './db.js';
import cors from 'cors';
import { hashPassword, comparePassword } from './components/hash.js';


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


const PORT = process.env.PORT || 5000;



app. get('/get-list', async (req, res) => {

  const list = await pool.query("SELECT * FROM list");
  res.status(200).json({ success: true, list: list.rows });
});



app. post('/add-list', async (req, res) => {
  const { listTitle } = req.body;

  await pool.query(
    'INSERT INTO list (title, status) VALUES ($1, $2)', 
    [listTitle, "pending"]);

  res.status(200).json({ success: true, message: 'List added successfully  ' });
});



app.post('/edit-list', async (req, res) => {
  const { listTitle, id } = req.body;

  await pool.query(
    'UPDATE list SET title = $1 WHERE id = $2',  
    [listTitle, id]
  );

  res.status(200).json({ success: true, message: 'List edited successfully' });
});

app.post('/delete-list', async (req, res) => {
  const { listTitle } = req.body;

  await pool.query(
    'DELETE FROM list WHERE title = $1',
    [listTitle]
  );
  res.status(200).json({ success: true, message: 'List deleted successfully' });
});




app.get('/get-items/:id', async (req, res) => {
  const listId = req.params.id;
  try {
    const result = await pool.query(
      "SELECT id, list_id, description, status FROM items WHERE list_id = $1",
      [listId]
    );
    // Map description to title for frontend (table has no title column)
    const items = result.rows.map((row) => ({ ...row, title: row.description }));
    res.status(200).json({ success: true, items });
  } catch (err) {
    console.error('get-items error:', err.message, err.code);
    const isMissingColumn = err.code === '42703';
    res.status(500).json({
      success: false,
      message: isMissingColumn
        ? 'Database schema mismatch: run schema.sql on your Render PostgreSQL (see server/schema.sql)'
        : 'Failed to fetch items',
    });
  }
});


app.post('/add-item', async (req, res) => {
  const { list_id, title, description, status } = req.body;
  const desc = description ?? title ?? '';
  try {
    await pool.query(
      "INSERT INTO items (list_id, description, status) VALUES ($1, $2, $3)",
      [list_id, desc, status ?? 'pending']
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('add-item error:', err.message, err.code);
    res.status(500).json({
      success: false,
      message: err.code === '42703' ? 'Database schema mismatch: run schema.sql on your Render PostgreSQL' : 'Failed to add item',
    });
  }
});



app.post('/edit-item', async (req, res) => {
  const { id, title, description, status } = req.body;
  const desc = description ?? title ?? '';
  try {
    await pool.query(
      "UPDATE items SET description=$1, status=$2 WHERE id=$3",
      [desc, status ?? 'pending', id]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('edit-item error:', err.message, err.code);
    res.status(500).json({
      success: false,
      message: err.code === '42703' ? 'Database schema mismatch: run schema.sql' : 'Failed to edit item',
    });
  }
});






app.post('/delete-item', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM items WHERE id=$1", [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('delete-item error:', err.message, err.code);
    res.status(500).json({
      success: false,
      message: err.code === '42703' ? 'Database schema mismatch: run schema.sql' : 'Failed to delete item',
    });
  }
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
    res.status(401).json({ success: false, message: "Handa agparis"});
  
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

    // Save session
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


app.get('/'), (req, res) => {
  res.send('Welcome to Express');

}

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: "Error logging out" });
    } else {
      res.status(200).json({ success: true, message: "Logged out successfully" });
    }
  });
}); 
app.listen (PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});













