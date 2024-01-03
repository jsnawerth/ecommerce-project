const express = require('express');
const passport = require('passport');
const pool = require('../db/index').getPool; // Import your database pool from db/index.js

const router = express.Router();

// Registration route
router.post('/register', async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;
  try {
    const result = await pool.query('INSERT INTO users(username, password, email, first_name, last_name) VALUES($1, $2, $3, $4, $5) RETURNING *', [
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

// Login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.redirect('/'); // Redirect to the home page or any other page after logout
  });
});


module.exports = router;