const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
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
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  planned_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  spent_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
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
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  percentage: {
  type: DataTypes.DECIMAL(5, 2),
  allowNull: true,
  validate: {
    min: 0,
    max: 100
  }
}
}, {
  tableName: 'budgets',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'category', 'month', 'year']
    }
  ]
});

module.exports = Budget;