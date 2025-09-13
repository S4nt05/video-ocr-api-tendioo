const express = require('express');
const { replyMessage } = require('../utils/tiktokApi');
const axios = require('axios');
const router = express.Router();

// Leer mensajes
router.get('/', async (req, res) => {
  try {
    const { access_token } = req.query;
    const response = await axios.get('https://open-api.tiktok.com/v2/message/list/', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Responder mensaje
router.post('/reply', async (req, res) => {
  try {
    const { access_token, message_id, text } = req.body;
    const result = await replyMessage(access_token, message_id, text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
