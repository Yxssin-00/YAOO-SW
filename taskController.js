const taskModel = require('../models/taskModel');

const createTask = async (req, res) => {
  const { title, description, due_date, priority } = req.body;
  try {
    const task = await taskModel.createTask(
      req.user.id,
      title,
      description,
      due_date,
      priority
    );
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await taskModel.getTasksByUser(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
};

const updateTask = async (req, res) => {
  const { title, description, due_date, priority } = req.body;
  const taskId = req.params.id;
  try {
    const task = await taskModel.getTaskById(taskId);
    if (!task || task.user_id !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const updated = await taskModel.updateTask(
      taskId,
      title,
      description,
      due_date,
      priority
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
};

const deleteTask = async (req, res) => {
  const taskId = req.params.id;
  try {
    const task = await taskModel.getTaskById(taskId);
    if (!task || task.user_id !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    await taskModel.deleteTask(taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateTask,
  deleteTask,
};