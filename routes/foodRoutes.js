const express = require('express');

const router = express.Router();

// Example route to test the MariaDB connection and query data
router.get('/foods', async (req, res) => {
  let connection;
  try {
    console.log('attempting to connect to db');
	  // Get a connection from the pool
    connection = await pool.getConnection();
     
    // Query the database
    const rows = await req.db.query('SELECT * FROM foods');
    console.log(rows); 
    // Send the result back to the client
    res.json(rows);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  } finally {
    // Always release the connection back to the pool
    if (connection) connection.release();
  }
});


module.exports = router;
