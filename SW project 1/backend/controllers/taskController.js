const asyncHandler = require('express-async-handler');
const { Task, User, SharedTask, Comment, Notification } = require('../models');
const moment = require('moment');

// @desc    Get all tasks owned by user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.findAll({
    where: { ownerId: req.user.id },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [['dueDate', 'ASC']]
  });
  res.json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Please add a title');
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    priority,
    ownerId: req.user.id
  });

  // Create notification if due date is within 3 days
  if (dueDate && moment(dueDate).diff(moment(), 'days') <= 3) {
    await Notification.create({
      message: `Task "${title}" is due soon (${moment(dueDate).format('MMM Do YYYY')})`,
      type: 'due-date',
      userId: req.user.id
    });
  }

  res.status(201).json(task);
});

// @desc    Get task details
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'email']
      },
      {
        model: Comment,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username']
          }
        ]
      }
    ]
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is owner or has access through shared task
  if (task.ownerId !== req.user.id) {
    const sharedTask = await SharedTask.findOne({
      where: { taskId: task.id, userId: req.user.id }
    });

    if (!sharedTask) {
      res.status(403);
      throw new Error('Not authorized to access this task');
    }
  }

  res.json(task);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is owner
  if (task.ownerId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const updatedTask = await task.update(req.body);
  res.json(updatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is owner
  if (task.ownerId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  await task.destroy();
  res.json({ message: 'Task removed' });
});

// @desc    Share a task with another user
// @route   POST /api/tasks/:id/share
// @access  Private
const shareTask = asyncHandler(async (req, res) => {
  const { userId, permission } = req.body;
  const taskId = req.params.id;

  const task = await Task.findByPk(taskId);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is owner
  if (task.ownerId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to share this task');
  }

  // Check if user exists
  const userToShareWith = await User.findByPk(userId);
  if (!userToShareWith) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if task is already shared with this user
  const existingShare = await SharedTask.findOne({
    where: { taskId, userId }
  });

  if (existingShare) {
    res.status(400);
    throw new Error('Task already shared with this user');
  }

  // Share the task
  const sharedTask = await SharedTask.create({
    taskId,
    userId,
    permission: permission || 'view'
  });

  // Create notification for the shared user
  await Notification.create({
    message: `${req.user.username} shared a task "${task.title}" with you`,
    type: 'shared-task',
    userId
  });

  res.status(201).json(sharedTask);
});

// @desc    Get tasks shared with the authenticated user
// @route   GET /api/shared-tasks
// @access  Private
const getSharedTasks = asyncHandler(async (req, res) => {
  const sharedTasks = await SharedTask.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Task,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'username']
          }
        ]
      }
    ]
  });

  res.json(sharedTasks);
});

// @desc    Update a shared task (if permission granted)
// @route   PUT /api/shared-tasks/:id
// @access  Private
const updateSharedTask = asyncHandler(async (req, res) => {
  const sharedTask = await SharedTask.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!sharedTask) {
    res.status(404);
    throw new Error('Shared task not found or not authorized');
  }

  if (sharedTask.permission !== 'edit') {
    res.status(403);
    throw new Error('You only have view permission for this task');
  }

  const task = await Task.findByPk(sharedTask.taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const updatedTask = await task.update(req.body);
  res.json(updatedTask);
});

// @desc    Remove access to a shared task
// @route   DELETE /api/shared-tasks/:id
// @access  Private
const removeSharedTask = asyncHandler(async (req, res) => {
  const sharedTask = await SharedTask.findOne({
    where: { id: req.params.id }
  });

  if (!sharedTask) {
    res.status(404);
    throw new Error('Shared task not found');
  }

  // Check if user is owner of the task or the shared user
  const task = await Task.findByPk(sharedTask.taskId);
  if (task.ownerId !== req.user.id && sharedTask.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to remove this shared task');
  }

  await sharedTask.destroy();
  res.json({ message: 'Shared task access removed' });
});

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const taskId = req.params.id;

  if (!content) {
    res.status(400);
    throw new Error('Please add a comment');
  }

  const task = await Task.findByPk(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user has access to the task (owner or shared)
  if (task.ownerId !== req.user.id) {
    const sharedTask = await SharedTask.findOne({
      where: { taskId, userId: req.user.id }
    });

    if (!sharedTask) {
      res.status(403);
      throw new Error('Not authorized to comment on this task');
    }
  }

  const comment = await Comment.create({
    content,
    taskId,
    userId: req.user.id
  });

  // Create notification for task owner if commenter is not the owner
  if (task.ownerId !== req.user.id) {
    await Notification.create({
      message: `${req.user.username} commented on your task "${task.title}"`,
      type: 'comment',
      userId: task.ownerId
    });
  }

  // Include author information in the response
  const commentWithAuthor = await Comment.findByPk(comment.id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }
    ]
  });

  res.status(201).json(commentWithAuthor);
});

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user has access to the task (owner or shared)
  if (task.ownerId !== req.user.id) {
    const sharedTask = await SharedTask.findOne({
      where: { taskId: task.id, userId: req.user.id }
    });

    if (!sharedTask) {
      res.status(403);
      throw new Error('Not authorized to view comments for this task');
    }
  }

  const comments = await Comment.findAll({
    where: { taskId: task.id },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json(comments);
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findByPk(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is owner or has edit permission if shared
  if (task.ownerId !== req.user.id) {
    const sharedTask = await SharedTask.findOne({
      where: { taskId: task.id, userId: req.user.id, permission: 'edit' }
    });

    if (!sharedTask) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }
  }

  const updatedTask = await task.update({ status });
  res.json(updatedTask);
});

module.exports = {
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
};