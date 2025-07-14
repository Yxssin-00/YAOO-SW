const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Notification = db.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.ENUM('due-date', 'shared-task', 'comment'),
    allowNull: false
  }
});

module.exports = Notification;