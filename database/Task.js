const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    dueDate: {
      type: DataTypes.DATE
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in-progress', 'completed'),
      defaultValue: 'pending'
    }
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    Task.hasMany(models.Comment, { foreignKey: 'taskId', as: 'comments' });
    Task.belongsToMany(models.User, { through: models.SharedTask, foreignKey: 'taskId', as: 'sharedWith' });
  };

  return Task;
};