// back/models/MonthlyBudget.js (ARCHIVO NUEVO)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonthlyBudget = sequelize.define('MonthlyBudget', {
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
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  }
}, {
  tableName: 'monthly_budgets',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'month', 'year']
    }
  ]
});

module.exports = MonthlyBudget;