// const express = require('express');
// const axios = require('axios');
// const router = express.Router();

// // Login TikTok
// router.get('/login', (req, res) => {
//   const redirectUri = process.env.REDIRECT_URI;
//   const clientKey = process.env.TIKTOK_CLIENT_KEY;
//   const scope = 'video.upload video.publish message.read message.write user.info.basic';
//   const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
//   res.redirect(authUrl);
// });

// // Callback OAuth
// router.get('/callback', async (req, res) => {
//   try {
//     const { code } = req.query;
//     const clientKey = process.env.TIKTOK_CLIENT_KEY;
//     const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
//     const redirectUri = process.env.REDIRECT_URI;

//     const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
//       client_key: clientKey,
//       client_secret: clientSecret,
//       code,
//       grant_type: 'authorization_code',
//       redirect_uri: redirectUri
//     });

//     const { access_token, open_id } = response.data.data;
//     // TODO: guardar en base de datos
//     res.json({ access_token, open_id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
// backend/routes/auth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const querystring = require('querystring');
const crypto = require('crypto');

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // debe coincidir con lo que registres en TikTok


function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

router.get('/login', (req, res) => {
  
  const code_verifier = generateCodeVerifier();
  const code_challenge = generateCodeChallenge(code_verifier);
  req.session.code_verifier = code_verifier;
  const scope = 'user.info.basic,video.upload,video.publish'; // ajusta scopes necesarios
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${code_challenge}&code_challenge_method=S256`;
  return res.redirect(url);
});

// router.get('/callback', async (req, res) => {
//   const { code } = req.query;
//   if (!code) return res.status(400).send('missing code');

//   try {
//     const tokenRes = await axios.post('https://open.tiktok.com/oauth/access_token/', {
//       client_key: CLIENT_KEY,
//       client_secret: CLIENT_SECRET,
//       code,
//       grant_type: 'authorization_code',
//       redirect_uri: REDIRECT_URI
//     }, { headers: { 'Content-Type': 'application/json' } });

//     const { access_token, open_id } = tokenRes.data.data || {};
//     // GUARDA access_token y open_id (en DB) asociado al usuario
//     // Luego redirige al frontend con datos mínimos:
//     return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/welcome?open_id=${open_id}`);
//   } catch (err) {
//     console.error('callback err', err.response?.data || err.message);
//     return res.status(500).send('Callback error');
//   }
// });
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const code_verifier = req.session.code_verifier;
  if (!code) return res.status(400).send('missing code');

  try {
    const tokenRes = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      querystring.stringify({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code_verifier
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, open_id } = tokenRes.data || {};
    if (open_id) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?open_id=${open_id}&token=${access_token}`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${access_token}`);
    }

  } catch (err) {
    console.error("callback err", err.response?.data || err.message);
    return res.status(500).send("Callback error");
  }
});
router.get('/user-info', async (req, res) => {
  const { token, open_id } = req.query;

  try {
    const userInfo = await axios.get(
      `https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    res.json(userInfo.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
