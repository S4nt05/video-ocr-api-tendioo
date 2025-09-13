const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadVideo(access_token, videoPath) {
  const form = new FormData();
  form.append('video', fs.createReadStream(videoPath));

  const res = await axios.post('https://open-api.tiktok.com/v2/video/upload/', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${access_token}`
    }
  });
  return res.data.data.video_id;
}

async function publishVideo(access_token, open_id, video_id, description, hashtags = []) {
  const res = await axios.post('https://open-api.tiktok.com/v2/video/publish/', {
    video_id,
    open_id,
    description,
    hashtags
  }, { headers: { 'Authorization': `Bearer ${access_token}` }});
  return res.data;
}

async function replyMessage(access_token, message_id, text) {
  const res = await axios.post('https://open-api.tiktok.com/v2/message/reply/', {
    message_id,
    text
  }, { headers: { 'Authorization': `Bearer ${access_token}` }});
  return res.data;
}

module.exports = { uploadVideo, publishVideo, replyMessage };
