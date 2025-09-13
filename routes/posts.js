// const express = require('express');
// const { uploadVideo, publishVideo } = require('../utils/tiktokApi');
// const router = express.Router();

// // Subir y publicar video
// router.post('/upload', async (req, res) => {
//   try {
//     const { access_token, open_id, videoPath, description, hashtags } = req.body;
//     const video_id = await uploadVideo(access_token, videoPath);
//     const result = await publishVideo(access_token, open_id, video_id, description, hashtags);
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
// tendioo/backend/routes/posts.js
const express = require('express');
const multer = require('multer');
const { connect } = require('../db');
const { uploadVideo, publishVideo } = require('../utils/tiktokApi');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../public/uploads/') });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { description, access_token, open_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });

    const videoPath = file.path;
    const video_id = await uploadVideo(access_token, videoPath);
    const result = await publishVideo(access_token, open_id, video_id, description || '', []);
    // opcional: borrar archivo local
    fs.unlink(videoPath, () => {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// programar post (guarda en lowdb scheduled)
router.post('/schedule', async (req, res) => {
  try {
    const conn = await connect();
    if (conn.mode === 'lowdb') {
      await conn.db.read();
      const id = `${Date.now()}`;
      conn.db.data.scheduled.push({
        id,
        ...req.body,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });
      await conn.db.write();
      return res.json({ ok: true, id });
    } else {
      // Implementar modelo Mongo
      return res.status(501).json({ error: 'Mongo schedule not implemented' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/local/list', async (req, res) => {
  try {
    const conn = await connect();
    if (conn.mode === 'lowdb') {
      await conn.db.read();
      return res.json(conn.db.data.posts || []);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
