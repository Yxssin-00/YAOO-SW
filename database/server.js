const db = require('./models');

// Database connection and server start
const PORT = process.env.PORT || 5000;
db.authenticate()
  .then(() => {
    console.log('Database connected...');
    return db.sync({ force: false }); // Set force: true to drop and recreate tables (for development)
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Unable to connect to the database:', err));