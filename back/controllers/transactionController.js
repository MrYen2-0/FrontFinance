const { Transaction, Budget } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener todas las transacciones del usuario
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category, startDate, endDate } = req.query;
    
    const where = { user_id: req.user.id };
    
    // Filtros opcionales
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const transactions = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      transactions: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page),
        pages: Math.ceil(transactions.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nueva transacción
const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { type, category, amount, description, date, tags } = req.body;

    const transaction = await Transaction.create({
      user_id: req.user.id,
      type,
      category,
      amount,
      description,
      date: date || new Date(),
      tags
    });

    // Si es un gasto, actualizar el presupuesto correspondiente
    if (type === 'expense') {
      const currentMonth = moment(date).month() + 1;
      const currentYear = moment(date).year();
      
      const budget = await Budget.findOne({
        where: {
          user_id: req.user.id,
          category,
          month: currentMonth,
          year: currentYear
        }
      });

      if (budget) {
        budget.spent_amount = parseFloat(budget.spent_amount) + parseFloat(amount);
        await budget.save();
      }
    }

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar transacción
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, description, date, tags } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    await transaction.update({
      type,
      category,
      amount,
      description,
      date,
      tags
    });

    res.json({
      message: 'Transacción actualizada exitosamente',
      transaction
    });
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar transacción
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }

    await transaction.destroy();

    res.json({ message: 'Transacción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener resumen de transacciones
const getTransactionSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const startDate = moment(`${currentYear}-${currentMonth}-01`).startOf('month');
    const endDate = moment(startDate).endOf('month');

    // Total de ingresos y gastos del mes
    const summary = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      },
      raw: true
    });

    const totalIncome = summary
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = summary
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Gastos por categoría
    const expensesByCategory = {};
    summary
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
      });

    res.json({
      period: { month: currentMonth, year: currentYear },
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
      transactionCount: summary.length
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
};