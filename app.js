// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const { getConnection } = require('./db');
// Initialize the Express app
const app = express();
// Import the agents routes
const agentRoutes = require('./routes/agentRoutes');
const foodRoutes = require('./routes/foodRoutes');


app.use(bodyParser.json());

// Mount the agents routes at the /agents path
app.use('/agents', agentRoutes);
app.use('/foods', foodRoutes);

const port = 3000; 
// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
