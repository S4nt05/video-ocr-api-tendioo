// tendioo/backend/db.js
// Conexión flexible: si tienes MONGO_URI usa MongoDB, si no usa lowdb (archivo JSON)
// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');

// const DB_MODE = process.env.DB_MODE || 'lowdb'; // 'mongo' or 'lowdb'

// async function connect() {
// const { Low } = await import('lowdb');
// const { JSONFile } = await import('lowdb/node'); // OJO: import desde 'lowdb/node'
//   if (DB_MODE === 'mongo' && process.env.MONGO_URI) {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to MongoDB');
//     return { mode: 'mongo', mongoose };
//   } else {
//     const file = path.join(__dirname, 'localdb.json');
//     if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ users: [], posts: [], scheduled: [] }));
//     const adapter = new JSONFile(file);
//     const db = new Low(adapter);
//     await db.read();
//     db.data = db.data || { users: [], posts: [], scheduled: [] };
//     console.log('Using lowdb (file) as DB');
//     return { mode: 'lowdb', db, save: async () => db.write() };
//   }
// }

// module.exports = { connect };
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DB_MODE = process.env.DB_MODE || 'lowdb'; // 'mongo' or 'lowdb'

async function connect() {
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');

  if (DB_MODE === 'mongo' && process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    return { mode: 'mongo', mongoose };
  } else {
    const file = path.join(__dirname, 'localdb.json');
    const defaultData = { users: [], posts: [], scheduled: [] };

    // si no existe el archivo, lo creo con defaultData
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    }

    const adapter = new JSONFile(file);
    const db = new Low(adapter, defaultData); // 👈 pasás defaultData aquí
    await db.read();

    // si quedó vacío por cualquier motivo, refuerzo:
    db.data ||= defaultData;

    console.log('Using lowdb (file) as DB');
    return { mode: 'lowdb', db, save: async () => db.write() };
  }
}

module.exports = { connect };
