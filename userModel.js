const pool = require('../config/db');

const createUser = async (username, email, hashedPassword) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, hashedPassword]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const updateUser = async (id, username, email) => {
  const result = await pool.query(
    'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role, created_at',
    [username, email, id]
  );
  return result.rows[0];
};

module.exports = { createUser, findUserByEmail, getUserById, updateUser };