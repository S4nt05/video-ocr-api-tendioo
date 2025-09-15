const express = require('express');
const multer = require('multer');
const { connect } = require('../db');
const { uploadVideo, publishVideo } = require('../utils/tiktokApi');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const uploadDir = path.join(__dirname, '../public/uploads/');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// router.post('/upload', upload.single('video'), async (req, res) => {
//   try {
//     if (process.env.USE_TIKTOK_MOCK === "true") {
//       return setTimeout(() => {
//         res.json({
//           status: "success",
//           video_id: "mock12345",
//           message: "Video subido correctamente (simulación)",
//           preview_url: "https://placekitten.com/400/300"
//         });
//       }, 1500);
//     }

//     const { description, access_token, open_id } = req.body;
//     const file = req.file;
//     if (!file) return res.status(400).json({ error: 'No file' });

//     const videoPath = file.path;
//     const video_id = await uploadVideo(access_token, videoPath);
//     const result = await publishVideo(access_token, open_id, video_id, description || '', []);
//     fs.unlink(videoPath, () => {});
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
console.log('NODE_ENV', process.env.NODE_ENV);
console.log('PWD', process.cwd());
console.log('Files in ./routes', require('fs').readdirSync('./routes'));


    if (process.env.USE_TIKTOK_MOCK === "true") {
      return setTimeout(() => {
        res.json({
          status: "success",
          video_id: "mock12345",
          message: "Video subido correctamente (simulación)",
          preview_url: "https://placekitten.com/400/300"
        });
      }, 1500);
    }

    const { description, access_token, open_id, hashtags } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Parsear hashtags
    let hashtagsArray = [];
    if (hashtags) {
      try {
        hashtagsArray = JSON.parse(hashtags);
      } catch (e) {
        hashtagsArray = hashtags.split(',').map(h => h.trim());
      }
    }

    const videoPath = file.path;

    // Subida a TikTok
    const video_id = await uploadVideo(access_token, videoPath);
    const result = await publishVideo(access_token, open_id, video_id, description || '', hashtagsArray);

    // Borrar archivo temporal
    fs.unlink(videoPath, () => {});

    res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
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
        createdAt: new Date().toISOString(),
        publishAt: new Date(req.body.publishAt).toISOString()
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
// GET todas las programadas
router.get('/schedule', async (req, res) => {
  try {
    const conn = await connect();
    if (conn.mode === 'lowdb') {
      await conn.db.read();
      return res.json(conn.db.data.scheduled || []);
    }
    return res.status(501).json({ error: 'Mongo schedule not implemented' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar publicación (reprogramar/editar)
router.put('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await connect();
    if (conn.mode === 'lowdb') {
      await conn.db.read();
      const idx = conn.db.data.scheduled.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Post not found' });
      conn.db.data.scheduled[idx] = { ...conn.db.data.scheduled[idx], ...req.body };
      await conn.db.write();
      return res.json({ ok: true });
    }
    return res.status(501).json({ error: 'Mongo schedule not implemented' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE publicación
router.delete('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await connect();
    if (conn.mode === 'lowdb') {
      await conn.db.read();
      conn.db.data.scheduled = conn.db.data.scheduled.filter(p => p.id !== id);
      await conn.db.write();
      return res.json({ ok: true });
    }
    return res.status(501).json({ error: 'Mongo schedule not implemented' });
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
