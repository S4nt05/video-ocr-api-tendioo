// tendioo/backend/routes/tiktokStats.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * GET /api/tiktok/stats?access_token=ACT_xxx
 *
 * Devuelve:
 * {
 *   summary: { follower_count, total_likes, video_count },
 *   timeseries: [ { day: '2025-09-01', views: 1200, likes: 100 }, ... ],
 *   videos: [ { id, view_count, like_count, comment_count, create_time }, ... ]
 * }
 *
 * Nota: requiere scopped token con user.info.* y video.list (o video.*) según lo que aprobó TikTok.
 */

const API_BASE = 'https://open.tiktokapis.com/v2'; // v2 docs
router.get('/', async (req, res) => {
  try {
    const access_token = req.query.access_token;
    if (!access_token) return res.status(400).json({ error: 'missing access_token' });

    // 1) Get user info (followers, like_count, video_count) - v2 user/info
    const userInfoResp = await axios.get(`${API_BASE}/user/info/?fields=open_id,avatar_url,display_name,followers_count,likes_count,video_count`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = userInfoResp.data?.data?.user || {};
    const summary = {
      open_id: user.open_id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      follower_count: user.followers_count || user.follower_count || 0,
      total_likes: user.likes_count || user.likes_count || 0,
      video_count: user.video_count || 0
    };

    // 2) Get video list (paginated) with metrics
    // Use video/list/ and request fields: id, view_count, like_count, comment_count, create_time
    const listResp = await axios.post(`${API_BASE}/video/list/`, {
      max_count: 50, // ajusta paginacion
      fields: ['id', 'view_count', 'like_count', 'comment_count', 'create_time']
    }, {
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }
    });

    const videos = (listResp.data?.data?.videos || []).map(v => ({
      id: v.id || v.video_id || v.item_id,
      view_count: v.view_count || 0,
      like_count: v.like_count || 0,
      comment_count: v.comment_count || 0,
      create_time: v.create_time || 0
    }));

    // 3) Build a simple timeseries aggregated by day (last 14 days)
    const timeseriesMap = {};
    const daysToKeep = 14;
    const now = new Date();
    for (let i = 0; i < daysToKeep; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (daysToKeep - 1 - i));
      const key = d.toISOString().slice(0, 10);
      timeseriesMap[key] = { day: key, views: 0, likes: 0 };
    }

    for (const v of videos) {
      const t = v.create_time ? new Date(v.create_time * 1000) : null;
      if (!t) continue;
      const day = t.toISOString().slice(0, 10);
      if (timeseriesMap[day]) {
        timeseriesMap[day].views += v.view_count;
        timeseriesMap[day].likes += v.like_count;
      } else {
        // si estás fuera del rango, ignora o agrega
      }
    }

    const timeseries = Object.values(timeseriesMap);

    return res.json({ summary, timeseries, videos });
  } catch (err) {
    console.error('stats err', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
