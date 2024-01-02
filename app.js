const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3000;

const db = require('./db/index.js')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});