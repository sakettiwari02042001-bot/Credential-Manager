const { Sequelize } = require('sequelize');

const sequelizeInstance = new Sequelize(
  process.env.DB_NAME || 'credential_manager',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'newpassword',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
  }
);

module.exports = sequelizeInstance;
