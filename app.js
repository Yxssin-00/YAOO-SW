const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

const app = express();



app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/task', taskRoutes);

app.get('/', (req, res) => {
  res.send('Task Management API is running');
});


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;