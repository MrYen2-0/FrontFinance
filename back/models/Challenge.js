const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Challenge = sequelize.define('Challenge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  target_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  current_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  difficulty: {
    type: DataTypes.ENUM('Fácil', 'Difícil'),
    allowNull: false
  },
  reward: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'failed'),
    defaultValue: 'active'
  }
}, {
  tableName: 'challenges'
});

module.exports = Challenge;