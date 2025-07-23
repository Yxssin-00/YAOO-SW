const pool = require('../config/db');

const createTask = async (userId, title, description, due_date, priority) => {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description, due_date, priority)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, title, description, due_date, priority]
  );
  return result.rows[0];
};

const getTasksByUser = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const getTaskById = async (id) => {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return result.rows[0];
};

const updateTask = async (id, title, description, due_date, priority) => {
  const result = await pool.query(
    `UPDATE tasks SET title=$1, description=$2, due_date=$3, priority=$4 
     WHERE id=$5 RETURNING *`,
    [title, description, due_date, priority, id]
  );
  return result.rows[0];
};

const deleteTask = async (id) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
};

module.exports = {
  createTask,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask,
};