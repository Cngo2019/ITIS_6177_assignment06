const express = require('express');
const router = express.Router();
const pool = require('../db');
const sanitizeHtml = require('sanitize-html');

/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       properties:
 *         agentCode:
 *           type: string
 *           example: "A007"
 *         agentName:
 *           type: string
 *           example: "John Doe"
 *         workingArea:
 *           type: string
 *           example: "New York"
 *         commission:
 *           type: string
 *           example: "0.05"
 *         phoneNumber:
 *           type: string
 *           example: "077-25814763"
 *         country:
 *           type: string
 *           example: "USA"
 */

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Retrieve all agents
 *     description: Retrieves a list of all agents, converting UPPER_CASE fields to camelCase.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of agents.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.promise().getConnection();
        const [rows] = await conn.execute('SELECT * FROM agents');
        const cleanedRows = rows.map(row => convertToCamelCaseKeys(row));
        res.json(cleanedRows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Error occurred. The request is invalid.' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * @swagger
 * /agents/{agentCode}:
 *   get:
 *     summary: Retrieve an agent by agentCode
 *     description: Retrieves a single agent by their agentCode.
 *     parameters:
 *       - name: agentCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the agent.
 *       404:
 *         description: Agent not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/:agentCode', async (req, res) => {
    const agentCode = req.params.agentCode.trim();
    let conn;
    try {
        conn = await pool.promise().getConnection();
        const [rows] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [agentCode]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Agent not found' });
        }
        res.json(convertToCamelCaseKeys(rows[0]));
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Error occurred. The request is invalid.' });
    } finally {
        if (conn) conn.release();
    }
});

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     description: Adds a new agent to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Agent"
 *     responses:
 *       201:
 *         description: Agent created successfully.
 *       400:
 *         description: Agent already exists.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/', async (req, res) => {
    const sanitizedBody = trimObjectValues(req.body);
    let conn;
    try {
        conn = await pool.promise().getConnection();
        const [existingAgent] = await conn.execute('SELECT * FROM agents WHERE AGENT_CODE = ?', [sanitizedBody.agentCode]);
        if (existingAgent.length > 0) {
            return res.status(400).json({ message: 'Agent with this code already exists' });
        }
        await conn.execute(
            'INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)',
            [
                sanitizedBody.agentCode,
                sanitizedBody.agentName,
                sanitizedBody.workingArea,
                sanitizedBody.commission,
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

/**
 * @swagger
 * /agents/{agentCode}:
 *   put:
 *     summary: Fully update an agent
 *     description: Replaces all details of an agent based on the provided agentCode.
 *     parameters:
 *       - name: agentCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Agent"
 *     responses:
 *       200:
 *         description: Agent updated successfully.
 *       404:
 *         description: Agent not found.
 *       500:
 *         description: Internal Server Error.
 */
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
                sanitizedBody.commission,
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

/**
 * @swagger
 * /agents/{agentCode}:
 *   delete:
 *     summary: Delete an agent
 *     description: Deletes an agent by agentCode.
 *     parameters:
 *       - name: agentCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agent deleted successfully.
 *       404:
 *         description: Agent not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete('/:agentCode', async (req, res) => {
    const agentCode = sanitizeInput(req.params.agentCode);
    let conn;
    try {
        conn = await pool.promise().getConnection();
        const [result] = await conn.execute('DELETE FROM agents WHERE AGENT_CODE = ?', [agentCode]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Agent not found' });
        res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
});

// Helper functions
const sanitizeInput = (input) => (typeof input === 'string' ? sanitizeHtml(input.trim()).replace(/['";`]/g, '') : input);
const trimObjectValues = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const trimmedObject = {};
    Object.keys(obj).forEach((key) => {
        trimmedObject[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
    });
    return trimmedObject;
};
const convertToCamelCaseKeys = (row) => {
    if (!row || typeof row !== 'object') return row;
    const keyMapping = {
        AGENT_CODE: "agentCode",
        AGENT_NAME: "agentName",
        WORKING_AREA: "workingArea",
        COMMISSION: "commission",
        PHONE_NO: "phoneNumber",
        COUNTRY: "country"
    };
    const camelCaseObject = {};
    Object.keys(row).forEach((key) => {
        const camelKey = keyMapping[key] || key.toLowerCase();
        camelCaseObject[camelKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    });
    return camelCaseObject;
};

module.exports = router;

