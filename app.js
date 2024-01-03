const express = require('express');
const session = require('express-session');
const initializePassport = require('./db/index.js').initializePassport;

const db = require('./db/index.js')
const authRoutes = require('./routes/authRoutes.js');
const passport = require('passport');

const app = express();
const port = 3000;

initializePassport(passport);

app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', './views');   // Set the views directory

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.get('/login', (req, res) => {
  // Check if user is already authenticated
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard'); // Redirect to a dashboard or home page
  }
  res.render('login'); // Render login.ejs
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Forward any errors to the next middleware
    }
    if (!user) {
      // Authentication failed
      return res.json({ success: false, message: 'Invalid username or password' });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // Successful login
      // return res.json({ success: true, user });
      // Redirect to a dashboard or home page on successful login
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

app.get('/register', (req, res) => {
  res.render('register'); // Render register.ejs
});

app.post('/register', async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  try {
    const result = await db.getPool().query('INSERT INTO users(username, password, email, first_name, last_name) VALUES($1, $2, $3, $4, $5) RETURNING *', [
      username,
      password,
      email,
      firstName,
      lastName
    ]);

    const user = result.rows[0];

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, user });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.redirect('/login');
})

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
})

app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});