const express = require('express');
const router = express.Router();
const pool = require('../db');  // Import the DB connection pool

// Route to get all agents
router.get('/', async (req, res) => {
  try {
    const conn = await pool.promise().getConnection();
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
  const { agentCode } = req.params;

  try {
    const conn = await pool.promise().getConnection();
    const [rows, fields] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(rows[0]);
    conn.release();
  } catch (error) {
    console.error('Error fetching agent by AGENT_CODE:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to get agents by WORKING_AREA
router.get('/area/:workingArea', async (req, res) => {
  const { workingArea } = req.params;

  try {
    const conn = await pool.promise().getConnection();
    const [rows, fields] = await conn.execute('SELECT * FROM agents WHERE WORKING_AREA = ?', [workingArea]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No agents found in this area' });
    }

    res.json(rows);
    conn.release();
  } catch (error) {
    console.error('Error fetching agents by WORKING_AREA:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT: Update an agent by AGENT_CODE
router.put('/:agentCode', async (req, res) => {
  const { agentCode } = req.params;
  const { AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;

  try {
    const conn = await pool.promise().getConnection();

    const [result] = await conn.execute(
      `UPDATE agents SET AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ?
       WHERE AGENT_CODE = ?`,
      [AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY, agentCode]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent updated successfully' });
    conn.release();
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST: Create a new agent
router.post('/', async (req, res) => {
  const { AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;

  try {
    const conn = await pool.promise().getConnection();

    // Check if the agent already exists
    const [existingAgent] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [AGENT_CODE]);
    if (existingAgent.length > 0) {
      return res.status(400).json({ message: 'Agent with this code already exists' });
    }

    // Insert the new agent into the database
    const [result] = await conn.execute(
      'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)',
      [AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY]
    );

    res.status(201).json({ message: 'Agent created successfully', agentId: result.insertId });
    conn.release();
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PATCH: Partially update an agent's details by AGENT_CODE
router.patch('/:agentCode', async (req, res) => {
  const { agentCode } = req.params;
  const { AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;

  try {
    const conn = await pool.promise().getConnection();

    const updateFields = [];
    const updateValues = [];
    
    if (AGENT_NAME) {
      updateFields.push('AGENT_NAME = ?');
      updateValues.push(AGENT_NAME);
    }
    if (WORKING_AREA) {
      updateFields.push('WORKING_AREA = ?');
      updateValues.push(WORKING_AREA);
    }
    if (COMMISSION) {
      updateFields.push('COMMISSION = ?');
      updateValues.push(COMMISSION);
    }
    if (PHONE_NO) {
      updateFields.push('PHONE_NO = ?');
      updateValues.push(PHONE_NO);
    }
    if (COUNTRY) {
      updateFields.push('COUNTRY = ?');
      updateValues.push(COUNTRY);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(agentCode);  // Add agentCode at the end of the array
    
    const updateQuery = `UPDATE agents SET ${updateFields.join(', ')} WHERE AGENT_CODE = ?`;

    const [result] = await conn.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent updated successfully' });
    conn.release();
  } catch (error) {
    console.error('Error partially updating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE: Delete an agent by AGENT_CODE
router.delete('/:agentCode', async (req, res) => {
  const { agentCode } = req.params;

  try {
    const conn = await pool.promise().getConnection();

    const [result] = await conn.execute('DELETE FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent deleted successfully' });
    conn.release();
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;

