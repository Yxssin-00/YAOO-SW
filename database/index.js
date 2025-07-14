const { Sequelize } = require('sequelize');
const db = require('../config/db');

const User = require('./User');
const Task = require('./Task');
const SharedTask = require('./SharedTask');
const Comment = require('./Comment');
const Notification = require('./Notification');

// Initialize models
User.initModel(db);
Task.initModel(db);
SharedTask.initModel(db);
Comment.initModel(db);
Notification.initModel(db);

// Set up relationships
User.associate(db.models);
Task.associate(db.models);
SharedTask.associate(db.models);
Comment.associate(db.models);
Notification.associate(db.models);

module.exports = db;