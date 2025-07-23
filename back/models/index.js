// back/models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const MonthlyBudget = require('./MonthlyBudget'); // AGREGAR ESTA LÍNEA
const Goal = require('./Goal');
const Challenge = require('./Challenge');

// Definir asociaciones
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(MonthlyBudget, { foreignKey: 'user_id', as: 'monthlyBudgets' }); // AGREGAR
MonthlyBudget.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); // AGREGAR

User.hasMany(Goal, { foreignKey: 'user_id', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Challenge, { foreignKey: 'user_id', as: 'challenges' });
Challenge.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Transaction,
  Budget,
  MonthlyBudget, // AGREGAR ESTA LÍNEA
  Goal,
  Challenge
};