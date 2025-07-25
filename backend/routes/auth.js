const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
  const router = require('express').Router();

  // Signup
  router.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    try {
      const [existing] = await pool.query(
        'SELECT * FROM users WHERE username = ? OR email = ?', 
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const token = jwt.sign(
        { id: result.insertId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.status(201).json({ token, userId: result.insertId });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Server error during signup" });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: users[0].id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Updated response with redirectTo
    res.json({ 
      token, 
      userId: users[0].id,
      username: users[0].username,
      redirectTo: "/index.html"  // ← Key change
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

  return router;
};