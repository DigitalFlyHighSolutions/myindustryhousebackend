module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'seller-db',
      user: 'user',
      password: 'password',
      database: 'sellerdb'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
