const express = require('express');
const axios = require('axios');
const router = express.Router();

// Login TikTok
router.get('/login', (req, res) => {
  const redirectUri = process.env.REDIRECT_URI;
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const scope = 'video.upload video.publish message.read message.write user.info.basic';
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
});

// Callback OAuth
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const { access_token, open_id } = response.data.data;
    // TODO: guardar en base de datos
    res.json({ access_token, open_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
