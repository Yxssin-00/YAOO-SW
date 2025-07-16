const { DataTypes } = require('sequelize');


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

  SharedTask.associate = (models) => {
    SharedTask.belongsTo(models.Task, { foreignKey: 'taskId' });
    SharedTask.belongsTo(models.User, { foreignKey: 'userId' });
  };

  module.exports = SharedTask;