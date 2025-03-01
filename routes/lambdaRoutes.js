const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /say:
 *   get:
 *     summary: Fetch data using a keyword
 *     description: Makes a request to an external API using the provided keyword.
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: The keyword to be used in the API request
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request, missing keyword
 *       500:
 *         description: Server error
 */
router.get('/say', 
async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword query parameter is required' });
        }

        const apiUrl = `https://20nixvjzvl.execute-api.us-east-2.amazonaws.com/Prod/say?keyword=${encodeURIComponent(keyword)}`;
        const response = await axios.get(apiUrl);
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});
module.exports = router;

