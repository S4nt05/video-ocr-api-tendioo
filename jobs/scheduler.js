// tendioo/backend/jobs/scheduler.js
// Cron que revisa posts programados y los publica.
// Necesita que los posts programados estén en la DB (campo status: 'scheduled', publishAt: ISO string)
const cron = require('node-cron');
const { connect } = require('../db');
const { uploadVideo, publishVideo } = require('../utils/tiktokApi');

module.exports = async function initScheduler() {
  const connection = await connect();

  // Ejecuta cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      if (connection.mode === 'lowdb') {
        const db = connection.db;
        await db.read();
        const now = new Date();
        const toPublish = db.data.scheduled.filter(p => p.status === 'scheduled' && new Date(p.publishAt) <= now);
        for (const job of toPublish) {
          try {
            // subir video y publicar
            const videoId = await uploadVideo(job.access_token, job.videoPath);
            await publishVideo(job.access_token, job.open_id, videoId, job.description || '', job.hashtags || []);
            job.status = 'posted';
            job.postedAt = new Date().toISOString();
          } catch (err) {
            job.status = 'error';
            job.error = err.message;
          }
        }
        await db.write();
      } else {
        // Implementar para Mongo si usas schemas
        // (ejemplo: ScheduledPostModel.find...)
      }
    } catch (err) {
      console.error('Scheduler error', err);
    }
  });

  console.log('Scheduler started (cron every minute)');
};
