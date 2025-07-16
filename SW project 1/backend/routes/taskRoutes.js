const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/middleware');
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  shareTask,
  getSharedTasks,
  updateSharedTask,
  removeSharedTask,
  addComment,
  getComments,
  updateTaskStatus
} = require('../controllers/taskController');

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route('/:id/share')
  .post(protect, shareTask);

router.route('/:id/comments')
  .get(protect, getComments)
  .post(protect, addComment);

router.route('/:id/status')
  .put(protect, updateTaskStatus);

router.route('/shared-tasks')
  .get(protect, getSharedTasks);

router.route('/shared-tasks/:id')
  .put(protect, updateSharedTask)
  .delete(protect, removeSharedTask);

module.exports = router;