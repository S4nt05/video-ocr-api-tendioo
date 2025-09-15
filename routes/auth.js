// // backend/routes/auth.js
// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const querystring = require('querystring');

// const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
// const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI; // debe coincidir con lo que registres en TikTok

// router.get('/login', (req, res) => {
//   const scope = 'user.info.basic,video.upload,video.publish'; // ajusta scopes necesarios
//   const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
//   return res.redirect(url);
// });

// router.get('/callback', async (req, res) => {
//   const { code } = req.query;
//   if (!code) return res.status(400).send('missing code');

//   try {
//     const tokenRes = await axios.post(
//       "https://open.tiktokapis.com/v2/oauth/token/",
//       querystring.stringify({
//         client_key: CLIENT_KEY,
//         client_secret: CLIENT_SECRET,
//         code,
//         grant_type: "authorization_code",
//         redirect_uri: REDIRECT_URI,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const { access_token, open_id } = tokenRes.data || {};
//     if (open_id) {
//     return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?open_id=${open_id}&token=${access_token}`);
//     } else {
//       return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${access_token}`);
//     }

//   } catch (err) {
//     console.error("callback err", err.response?.data || err.message);
//     return res.status(500).send("Callback error");
//   }
// });

// module.exports = router;
// routes/auth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const querystring = require('querystring');
const crypto = require('crypto');

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // debe coincidir con TikTok

// Función para generar code_verifier y code_challenge
function generatePKCE() {
  const code_verifier = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(code_verifier).digest();
  const code_challenge = hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return { code_verifier, code_challenge };
}

// Guardamos temporalmente los verifiers por state (en memoria simple)
const pkceStore = {}; // { state: code_verifier }

router.get('/login', (req, res) => {
  const scope = 'user.info.basic,video.upload,video.publish';
  const { code_verifier, code_challenge } = generatePKCE();
  const state = crypto.randomBytes(8).toString('hex'); // identificador

  // guardamos code_verifier asociado al state
  pkceStore[state] = code_verifier;

  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${code_challenge}&code_challenge_method=S256&state=${state}`;
  return res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('missing code');

  // Recuperamos code_verifier asociado a este state
  const code_verifier = pkceStore[state];
  if (!code_verifier) return res.status(400).send('missing code_verifier');

  // Una vez usado, lo eliminamos
  delete pkceStore[state];

  try {
    const tokenRes = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      querystring.stringify({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code_verifier // <- PKCE
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, open_id } = tokenRes.data || {}; // TikTok responde en .data.data
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
