module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'lead-db',
      user: 'admin',
      password: 'admin',
      database: 'lead_service_db'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
