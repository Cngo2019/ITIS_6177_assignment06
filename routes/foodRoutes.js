const express = require('express');

const pool = require('../db');  // Import the DB connection pool

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Get a connection from the pool
    const conn = await pool.promise().getConnection();

    // Execute the query to get all agents
    const [rows, fields] = await conn.execute('SELECT * FROM foods');
    res.json(rows);  // Send the result as JSON

    conn.release();  // Release the connection back to the pool
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
