const express = require('express');
const router = express.Router();
const pool = require('../db');  // Import the DB connection pool

// Route to get all agents
router.get('/', async (req, res) => {
  try {
    // Get a connection from the pool
    const conn = await pool.promise().getConnection();

    // Execute the query to get all agents
    const [rows, fields] = await conn.execute('SELECT * FROM agents');
    res.json(rows);  // Send the result as JSON

    conn.release();  // Release the connection back to the pool
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to get agent by AGENT_CODE
router.get('/:agentCode', async (req, res) => {
  const { agentCode } = req.params;  // Extract AGENT_CODE from the URL parameter

  try {
    // Get a connection from the pool
    const conn = await pool.promise().getConnection();

    // Execute the query to get the agent by AGENT_CODE
    const [rows, fields] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    // If no agent is found, return 404
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(rows[0]);  // Return the found agent as JSON
    conn.release();  // Release the connection back to the pool
  } catch (error) {
    console.error('Error fetching agent by AGENT_CODE:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to get agents by WORKING_AREA
router.get('/area/:workingArea', async (req, res) => {
  const { workingArea } = req.params;  // Extract WORKING_AREA from the URL parameter

  try {
    // Get a connection from the pool
    const conn = await pool.promise().getConnection();

    // Execute the query to get agents by WORKING_AREA
    const [rows, fields] = await conn.execute('SELECT * FROM agents WHERE WORKING_AREA = ?', [workingArea]);

    // If no agents are found, return 404
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No agents found in this area' });
    }

    res.json(rows);  // Return the found agents as JSON
    conn.release();  // Release the connection back to the pool
  } catch (error) {
    console.error('Error fetching agents by WORKING_AREA:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;

