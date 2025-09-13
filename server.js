// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const authRoutes = require('./routes/auth');
// const postsRoutes = require('./routes/posts');
// const messagesRoutes = require('./routes/messages');

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use('/api/auth', authRoutes);
// app.use('/api/posts', postsRoutes);
// app.use('/api/messages', messagesRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// tendioo/backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const messagesRoutes = require('./routes/messages');
const tiktokStats = require('./routes/tiktokStats');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas api
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/tiktok/stats', tiktokStats); // o app.use('/api/tiktok', tiktokStats)
// Carpeta pública para subir temporales si usas upload local
app.use('/public', express.static(path.join(__dirname, 'public')));

// Inicia scheduler de jobs (programación)
require('./jobs/scheduler')();

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
