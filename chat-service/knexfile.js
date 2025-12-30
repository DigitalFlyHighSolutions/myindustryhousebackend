module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'chat-db',
      user: 'admin',
      password: 'admin',
      database: 'chat_service_db'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
