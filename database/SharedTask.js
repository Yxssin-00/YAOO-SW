const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SharedTask = sequelize.define('SharedTask', {
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

  SharedTask.associate = (models) => {
    SharedTask.belongsTo(models.Task, { foreignKey: 'taskId' });
    SharedTask.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return SharedTask;
};