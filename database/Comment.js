const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
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

  Comment.associate = (models) => {
    Comment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    Comment.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
  };

  return Comment;
};