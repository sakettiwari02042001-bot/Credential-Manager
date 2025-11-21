const app = require('./src/app');
const db = require('./src/config/db');
const dotenv = require('dotenv');
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
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });