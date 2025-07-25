require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Restrict CORS in production
}));
app.use(express.json()); // For parsing application/json

// Database Configuration (using .env)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // NEVER hardcode passwords!
  database: process.env.DB_NAME || 'music_A',
  waitForConnections: true,
  connectionLimit: 10,
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false // Disable automatic index.html serving
}));
app.use('/songs', express.static(path.join(__dirname, 'songs')));

// API Routes
app.get('/api/albums', async (req, res) => {
  try {
    const albums = fs.readdirSync('songs').map(folder => {
      const infoPath = path.join('songs', folder, 'info.json');
      return {
        name: folder,
        cover: `/songs/${folder}/cover.jpg`,
        info: JSON.parse(fs.readFileSync(infoPath))
      };
    });
    res.json(albums);
  } catch (err) {
    console.error('Error loading albums:', err);
    res.status(500).json({ error: 'Failed to load albums' });
  }
});

app.get('/api/songs/:folder', async (req, res) => {
  try {
    const folderPath = path.join(__dirname, 'songs', req.params.folder);
    const songs = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.mp3'))
      .map(song => song); 
    
    res.json(songs);
  } catch (err) {
    console.error('Error reading songs:', err);
    res.status(404).json({ error: 'Album not found' });
  }
});

// Auth Routes (imported separately)
const authRoutes = require('./routes/auth')(pool);
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

// Catch-all route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '../frontend/signup.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
