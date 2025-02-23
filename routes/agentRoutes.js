const express = require('express');
const router = express.Router();
const pool = require('../db');  // Import the DB connection pool
const sanitizeHtml = require('sanitize-html');

// Function to trim all string values in an object
const trimObjectValues = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const trimmedObject = {};
  Object.keys(obj).forEach((key) => {
    trimmedObject[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
  });
  return trimmedObject;
};
// GET: Retrieve all agents (Trimmed)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.promise().getConnection();
    const [rows] = await conn.execute('SELECT * FROM agents');

    // Trim spaces from all string values in each row
    const cleanedRows = rows.map(trimObjectValues);

    res.json(cleanedRows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error occurred. The request is invalid.' });
  } finally {
    if (conn) conn.release();
  }
});

// GET: Retrieve an agent by AGENT_CODE (Trimmed)
router.get('/:agentCode', async (req, res) => {
  const agentCode = req.params.agentCode.trim();
  let conn;

  try {
    conn = await pool.promise().getConnection();
    const [rows] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [agentCode]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(trimObjectValues(rows[0])); // Trim spaces before returning
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error occurred. The request is invalid.' });
  } finally {
    if (conn) conn.release();
  }
});

// POST: Create a new agent (No Commission Validation)
router.post('/', async (req, res) => {
  const sanitizedBody = trimObjectValues(req.body);
  
  let conn;
  try {
    conn = await pool.promise().getConnection();

    // Check if the agent already exists
    const [existingAgent] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [sanitizedBody.agentCode]);
    if (existingAgent.length > 0) {
      return res.status(400).json({ message: 'Agent with this code already exists' });
    }

    // Insert the new agent
    await conn.execute(
      'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)',
      [
        sanitizedBody.agentCode,
        sanitizedBody.agentName,
        sanitizedBody.workingArea,
        sanitizedBody.commission, // No validation
        sanitizedBody.phoneNumber,
        sanitizedBody.country
      ]
    );

    res.status(201).json(sanitizedBody);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error occurred. The request is invalid.' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT: Update an agent by agentCode (No Commission Validation)
router.put('/:agentCode', async (req, res) => {
  const agentCode = req.params.agentCode.trim();
  const sanitizedBody = trimObjectValues(req.body);

  let conn;
  try {
    conn = await pool.promise().getConnection();
    const [result] = await conn.execute(
      `UPDATE agents SET AGENT_NAME = ?, WORKING_AREA = ?, COMMISSION = ?, PHONE_NO = ?, COUNTRY = ? 
      WHERE AGENT_CODE = ?`,
      [
        sanitizedBody.agentName,
        sanitizedBody.workingArea,
        sanitizedBody.commission, // No validation
        sanitizedBody.phoneNumber,
        sanitizedBody.country,
        agentCode
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.status(200).json({ message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error occurred. The request is invalid.' });
  } finally {
    if (conn) conn.release();
  }
});

// PATCH: Partially update an agent's details by AGENT_CODE (No Commission Validation)
router.patch('/:agentCode', async (req, res) => {
  const agentCode = req.params.agentCode.trim();
  const sanitizedBody = trimObjectValues(req.body);

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
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error occurred. The request is invalid.' });
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

