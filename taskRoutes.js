const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/tasks', protect, taskController.createTask);
router.get('/tasks', protect, taskController.getMyTasks);
router.put('/tasks/:id', protect, taskController.updateTask);
router.delete('/tasks/:id', protect, taskController.deleteTask);

module.exports = router;