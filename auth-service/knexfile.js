module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'auth-db',
      user: 'auth_user',
      password: 'auth_password',
      database: 'authdb'
    },
    migrations: {
      directory: './db/migrations'
    }
  }
};
