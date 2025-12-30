module.exports = {
    development: {
        client: 'pg',
        connection: {
            host: 'user-db',
            user: 'user_user',
            password: 'user_password',
            database: 'userdb'
        },
        migrations: {
            directory: './db/migrations'
        }
    }
};