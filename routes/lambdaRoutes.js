const express = require('express');
const router = express.Router();
const axios = require('axios');


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

