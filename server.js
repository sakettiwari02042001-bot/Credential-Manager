const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const db = require('./src/config/db');
const sequelizeInstance = require('./src/db/sequelizeInstance');

const PORT = process.env.PORT || 3000;

// Example query
db.query('SELECT 1')
  .then(([rows]) => {
    console.log('DB Connected:', rows);
  })
  .catch(err => {
    console.error('DB Connection Error:', err);
  });

// Sync database tables and start server
sequelizeInstance.sync({ alter: true })
  .then(() => {
    console.log('Database synced!');
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('Database sync error:', err);
    process.exit(1);
  });