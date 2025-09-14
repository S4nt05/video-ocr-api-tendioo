// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');        // mounted at /api/auth
const postsRoutes = require('./routes/posts');      // mounted at /api/posts
const messagesRoutes = require('./routes/messages'); // mounted at /api/messages
const tiktokStats = require('./routes/tiktokStats'); // mounted at /api/tiktok/stats

const app = express();
// app.use(cors());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — imprescindible para Render/Railway
app.get('/', (req, res) => res.json({ ok: true, service: 'tendioo-backend' }));

// Montamos las rutas en prefijos claros
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/tiktok/stats', tiktokStats);

// Carpeta pública (temporal uploads)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Inicia scheduler
require('./jobs/scheduler')().catch(err => console.error('Scheduler init error', err));

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
