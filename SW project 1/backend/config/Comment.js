const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Comment = db.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = Comment;


