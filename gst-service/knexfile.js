module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'gst-db',
      user: 'admin',
      password: 'admin',
      database: 'gst_service_db'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
