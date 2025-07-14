const { DataTypes } = require('sequelize');
const db = require('../config/db');

const SharedTask = db.define('SharedTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permission: {
    type: DataTypes.ENUM('view', 'edit'),
    defaultValue: 'view'
  }
});

module.exports = SharedTask;