// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const { getConnection } = require('./db');
// Import the agents routes
const agentRoutes = require('./routes/agentRoutes');
const foodRoutes = require('./routes/foodRoutes');
const lambdaRoutes = require('./routes/lambdaRoutes');

const swaggerJsdoc = require("swagger-jsdoc");
const options = require("./swaggerOptions"); // Import the file above
const swaggerUi = require("swagger-ui-express");


const specs = swaggerJsdoc(options);
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));app.use(bodyParser.json());

// Mount the agents routes at the /agents path
app.use('/agents', agentRoutes);
app.use('/foods', foodRoutes);
app.use('/lambdas', lambdaRoutes);
const port = 3000; 
// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
