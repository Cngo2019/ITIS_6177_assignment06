const mysql = require('mysql2');

// Create a connection pool (recommended for production)
const pool = mysql.createPool({
  host: 'localhost',  // Replace with your database host or IP address
  user: 'root',            // Replace with your database username
  password: 'root',        // Replace with your database password
  database: 'sample',      // Replace with your database name
  port: 3306,              // The port your MariaDB/MySQL server is running on (default: 3306)
  waitForConnections: true, // Wait for connection if pool is full
  connectionLimit: 10,     // Max number of connections allowed in pool
  queueLimit: 0            // Number of requests allowed to be queued before being rejected
});
module.exports = pool;
