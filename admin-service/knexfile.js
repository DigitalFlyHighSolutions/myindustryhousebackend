// admin-service/knexfile.js
require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || process.env.ADMIN_DB_HOST || 'admin-db',
      port: process.env.DB_PORT || process.env.ADMIN_DB_PORT || 5432,
      user: process.env.DB_USER || process.env.ADMIN_DB_USER || 'admin',
      password: process.env.DB_PASSWORD || process.env.ADMIN_DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || process.env.ADMIN_DB_NAME || 'admin_service_db',
    },
    migrations: {
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
  },
};
