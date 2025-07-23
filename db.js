const { Pool } = require('pg');

// Create the pool connection
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '113355',
    database: 'new3.4'
});

// Test the connection
pool.connect()
    .then(() => {
        console.log(' Database connected successfully');
    })
    .catch((error) => {
        console.error(' Database connection error:', error.message);
    });

// Export the pool for use in other files
module.exports = pool;