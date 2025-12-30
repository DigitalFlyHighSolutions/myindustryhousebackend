module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'product-db',
      user: 'user',
      password: 'password',
      database: 'productdb'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
