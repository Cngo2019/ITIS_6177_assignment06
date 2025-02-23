const express = require('express');
const router = express.Router();
const pool = require('../db');  // Import the DB connection pool
const sanitizeHtml = require('sanitize-html');

// Route to get all agents
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.promise().getConnection();
    const [rows] = await conn.execute('SELECT * FROM agents');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// Route to get agent by AGENT_CODE
router.get('/:agentCode', async (req, res) => {
  const { agentCode } = req.params;
  let conn;

  try {
    conn = await pool.promise().getConnection();
    const [rows] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching agent by AGENT_CODE:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// Route to get agents by WORKING_AREA
router.get('/area/:workingArea', async (req, res) => {
  const { workingArea } = req.params;
  let conn;

  try {
    conn = await pool.promise().getConnection();
    const [rows] = await conn.execute('SELECT * FROM agents WHERE WORKING_AREA = ?', [workingArea]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No agents found in this area' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching agents by WORKING_AREA:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT: Update an agent by AGENT_CODE
router.put('/:agentCode', async (req, res) => {
  const agentCode = sanitizeInput(req.params.agentCode);
  const sanitizedBody = sanitizeBody(req.body);
  let conn;

  try {
    conn = await pool.promise().getConnection();
    const [result] = await conn.execute(
      `UPDATE agents SET AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ? WHERE AGENT_CODE = ?`,
      [sanitizedBody.AGENT_NAME, sanitizedBody.WORKING_AREA, sanitizedBody.COMMISSION, sanitizedBody.PHONE_NO, sanitizedBody.COUNTRY, agentCode]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// POST: Create a new agent
router.post('/', async (req, res) => {
  let { AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;
  const sanitizedAgentCode = sanitizeInput(AGENT_CODE);
  const sanitizedBody = sanitizeBody(req.body);
  let conn;

  try {
    conn = await pool.promise().getConnection();

    // Check if the agent already exists
    const [existingAgent] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [sanitizedAgentCode]);
    if (existingAgent.length > 0) {
      return res.status(400).json({ message: 'Agent with this code already exists' });
    }

    // Insert the new agent
    const [result] = await conn.execute(
      'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)',
      [sanitizedAgentCode, sanitizedBody.AGENT_NAME, sanitizedBody.WORKING_AREA, sanitizedBody.COMMISSION, sanitizedBody.PHONE_NO, sanitizedBody.COUNTRY]
    );

    res.status(201).json({ message: 'Agent created successfully', agentId: result.insertId });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// PATCH: Partially update an agent's details by AGENT_CODE
router.patch('/:agentCode', async (req, res) => {
  const agentCode = sanitizeInput(req.params.agentCode);
  const sanitizedBody = sanitizeBody(req.body);
  let conn;

  try {
    conn = await pool.promise().getConnection();

    const updateFields = [];
    const updateValues = [];

    Object.keys(sanitizedBody).forEach((key) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(sanitizedBody[key]);
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(agentCode);
    const updateQuery = `UPDATE agents SET ${updateFields.join(', ')} WHERE AGENT_CODE = ?`;

    const [result] = await conn.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Error partially updating agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE: Delete an agent by AGENT_CODE
router.delete('/:agentCode', async (req, res) => {
  const agentCode = sanitizeInput(req.params.agentCode);
  let conn;

  try {
    conn = await pool.promise().getConnection();
    const [result] = await conn.execute('DELETE FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

// Helper function to sanitize input
const sanitizeInput = (input) => (typeof input === 'string' ? sanitizeHtml(input.trim()).replace(/['";`]/g, '') : input);

// Sanitize request body for update and insert operations
const sanitizeBody = (body) => {
  const sanitized = {};
  Object.keys(body).forEach((key) => {
    sanitized[key] = typeof body[key] === 'string' ? sanitizeInput(body[key]) : body[key];
  });
  return sanitized;
};

module.exports = router;

