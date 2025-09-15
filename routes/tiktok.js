const axios = require('axios');
const fs = require('fs');

// Paso 1: iniciar la subida
async function initUpload(access_token, open_id) {
  const res = await axios.post('https://open-api.tiktok.com/v2/video/upload/init/', {
    access_token,
    open_id
  });
  if (res.data.error) throw new Error(JSON.stringify(res.data));
  return res.data.data; // { upload_url, video_id }
}

// Paso 2: subir binario a upload_url
async function uploadVideoFile(upload_url, videoPath) {
  const fileBuffer = fs.readFileSync(videoPath);
  const res = await axios.put(upload_url, fileBuffer, {
    headers: { 'Content-Type': 'video/mp4' }
  });
  return res.status === 200;
}

// Paso 3: publicar
async function publishVideo(access_token, open_id, video_id, description, hashtags = []) {
  const text = description + (hashtags.length ? ' ' + hashtags.map(h => `#${h}`).join(' ') : '');
  const res = await axios.post('https://open-api.tiktok.com/v2/video/publish/', {
    access_token,
    open_id,
    video_id,
    text
  });
  if (res.data.error) throw new Error(JSON.stringify(res.data));
  return res.data;
}

module.exports = { initUpload, uploadVideoFile, publishVideo };
