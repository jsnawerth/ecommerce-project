require('dotenv').config();
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const { Pool } = require('pg');
 
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const initializePassport = (passport) => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

          if (!result.rows.length) {
            //console.log('User not found:', username);
            return done(null, false, { message: 'Incorrect username.' });
          }

          const user = result.rows[0];
          //console.log('Hashed Password:', user.password);

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            //console.log('Incorrect password for user:', username);
            return done(null, false, { message: 'Incorrect password.' });
          }

          //console.log('User authenticated:', username);
          return done(null, user);
        } catch (err) {
          //console.error('Error during authentication:', err.message);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

      if (!result.rows.length) {
        return done(null, false, { message: 'User not found.' });
      }

      const user = result.rows[0];
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });
};

const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      console.error('Error executing query:', error.message);
      response.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    response.status(200).json(results.rows);
  });
};

const getUserById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      console.error('Error getting user:', error.message);
      response.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    response.status(200).json(results.rows)
  })
}

const createUser = (request, response) => {
  const {
    id,
    username,
    password,
    email,
    first_name,
    last_name,
    phone_number,
    address,
    city,
    country,
    zip_code,
  } = request.body;

  pool.query(
    'INSERT INTO users (id, username, password, email, first_name, last_name, phone_number, address, city, country, zip_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, username, email',
    [id, username, password, email, first_name, last_name, phone_number, address, city, country, zip_code],
    (error, results) => {
      if (error) {
        console.error('Error creating user:', error.message);
        response.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const createdUser = results.rows[0];
      response.status(201).json({
        message: 'User created successfully',
        user: {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
        },
      });
    }
  );
};


const updateUser = (request, response) => {
  const id = parseInt(request.params.id);
  const { username, password, email, first_name, last_name, phone_number, address, city, country, zip_code } = request.body;

  const updateFields = [];
  const values = [];

  if (username !== undefined) {
    updateFields.push(`username = $${updateFields.length+1}`);
    values.push(username);
    if(username == null){
      response.status(400).json({ error: 'Username should not be null' });
      return;
    }
  }

  if (password !== undefined) {
    updateFields.push(`password = $${updateFields.length+1}`);
    values.push(password);
    if(password == null){
      response.status(400).json({ error: 'Password should not be null' });
      return;
    }
  }

  if (email !== undefined) {
    updateFields.push(`email = $${updateFields.length+1}`);
    values.push(email);
    if(email == null){
      response.status(400).json({ error: 'Email should not be null' });
      return;
    }
  }

  if (first_name !== undefined) {
    updateFields.push(`first_name = $${updateFields.length+1}`);
    values.push(first_name);
    if(first_name == null){
      response.status(400).json({ error: 'First Name should not be null' });
      return;
    }
  }

  if (last_name !== undefined) {
    updateFields.push(`last_name = $${updateFields.length+1}`);
    values.push(last_name);
    if(last_name == null){
      response.status(400).json({ error: 'Last Name should not be null' });
      return;
    }
  }

  if (phone_number !== undefined) {
    updateFields.push(`phone_number = $${updateFields.length+1}`);
    values.push(phone_number);
  }

  if (address !== undefined) {
    updateFields.push(`address = $${updateFields.length+1}`);
    values.push(address);
  }

  if (city !== undefined) {
    updateFields.push(`city = $${updateFields.length+1}`);
    values.push(city);
  }

  if (country !== undefined) {
    updateFields.push(`country = $${updateFields.length+1}`);
    values.push(country);
  }

  if (zip_code !== undefined) {
    updateFields.push(`zip_code = $${updateFields.length+1}`);
    values.push(zip_code);
  }

  if (updateFields.length === 0) {
    // No fields to update
    response.status(400).json({ error: 'No valid fields provided for update.' });
    return;
  }

  // Build the dynamic update query
  const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${values.length + 1}`;

  // Execute the query
  pool.query(
    updateQuery,
    [...values, id],
    (error, results) => {
      if (error) {
        console.error('Error updating user:', error.message);
        response.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      response.status(200).send(`User modified with ID: ${id}`);
    }
  );
};

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      console.error('Error deleting user:', error.message);
      response.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  getPool: () => pool,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  initializePassport,
};