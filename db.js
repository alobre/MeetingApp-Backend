var express = require('express');
var app = express.Router();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const morgan = require('morgan');

//const { Pool } = require('pg');
//const pool = require("./db");

const pool = new Pool({
  connectionString: 'postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh',
  // max: 20, // Adjust this value based on your needs
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});


// Test the database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to the database');
  }
});

// Configure morgan to log requests
app.use(morgan('dev'));

// Parse JSON request bodies
app.use(bodyParser.json());
/*
// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh',
});

// Test the database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to the database');
  }
});

// Define your routes and CRUD operations here

// Start your Express server

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
*/

//Testing CRUD operations on elephantDB

app.post('/users', (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Both username and email are required' });
  }

  pool.query('INSERT INTO users (username, email) VALUES ($1, $2)', [username, email], (err, result) => {
    if (err) {
      console.error('Error inserting user into the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ message: 'User created successfully' });
    }
  });
});




app.get('/users', (req, res) => {
  console.log("first")
  // Use COUNT() to get the total number of users
  pool.query('SELECT COUNT(*) as total_users FROM users; SELECT * FROM users;', (err, result) => {
    if (err) {
      console.error('Error executing SQL query', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      console.log(result)
      // Extract the count from the first query result
      const totalUsers = result[0].rows[0].total_users;

      // Extract user data from the second query result
      const users = result[1].rows;

      // Create a response object with both the count and user data
      const response = {
        totalUsers,
        users,
      };
      res.json(response);
      res.send(response)
    }
  });
});

app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Both username and email are required' });
  }

  pool.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating user in the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'User updated successfully' });
    }
  });
});


app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  pool.query('DELETE FROM users WHERE id = $1', [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user from the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  });
});

app.post('/meetings', (req, res) => {
  const meeting_id = req.params.id;
  console.log(req.params)
  // pool.query('DELETE FROM meetings WHERE id = $1', [meeting_id], (err, result) => {
  //   if (err) {
  //     console.error('Error deleting user from the database', err);
  //     res.status(500).json({ error: 'Internal server error' });
  //   } else {
  //     res.json({ message: 'Meeting deleted successfully' });
  //   }
  // });
});

app.delete('/meetings/:id', (req, res) => {
  const meeting_id = req.params.id;

  pool.query('DELETE FROM meetings WHERE id = $1', [meeting_id], (err, result) => {
    if (err) {
      console.error('Error deleting user from the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Meeting deleted successfully' });
    }
  });
});


module.exports = pool;

