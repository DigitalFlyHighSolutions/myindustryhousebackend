const express = require('express');
const app = express();
const port = 5006;
const db = require('./db');
const userController = require('./controllers/userController');

app.use(express.json());

app.get('/users', userController.getAllUsers);
app.get('/users/:id', userController.getUserById);
app.post('/users', userController.createUser);
app.put('/users/:id', userController.updateUser);
app.delete('/users/:id', userController.deleteUser);

db.migrate.latest()
    .then(() => {
        console.log('Migrations are up to date');
        app.listen(port, () => {
            console.log(`User service listening at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Error running migrations', err);
        process.exit(1);
    });