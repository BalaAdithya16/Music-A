const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/songs', express.static(path.join(__dirname, 'songs')));

// API Endpoints
app.get('/api/albums', (req, res) => {
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

app.get('/api/songs/:folder', (req, res) => {
  try {
    const folderPath = path.join(__dirname, 'songs', req.params.folder);
    const songs = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.mp3'))
      .map(song => song); // Return raw filenames
    
    res.json(songs);
  } catch (err) {
    console.error('Error reading songs:', err);
    res.status(404).json({ error: 'Album not found' });
  }
});

// Handle all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});