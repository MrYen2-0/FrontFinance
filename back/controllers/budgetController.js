const { Budget, Transaction } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener presupuestos del usuario
const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const budgets = await Budget.findAll({
      where: {
        user_id: req.user.id,
        month: currentMonth,
        year: currentYear,
        is_active: true
      },
      order: [['category', 'ASC']]
    });

    // Calcular gastos reales para cada presupuesto
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = moment(`${currentYear}-${currentMonth}-01`).startOf('month');
        const endDate = moment(startDate).endOf('month');

        const actualSpending = await Transaction.sum('amount', {
          where: {
            user_id: req.user.id,
            category: budget.category,
            type: 'expense',
            date: {
              [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
            }
          }
        });

        const spent = actualSpending || 0;
        const remaining = parseFloat(budget.planned_amount) - spent;

        return {
          id: budget.id,
          category: budget.category,
          planned: parseFloat(budget.planned_amount),
          spent: spent,
          remaining: remaining,
          percentage: (spent / parseFloat(budget.planned_amount)) * 100
        };
      })
    );

    res.json({ budgets: budgetsWithSpending });
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear o actualizar presupuesto
const upsertBudget = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { category, planned_amount, month, year } = req.body;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const [budget, created] = await Budget.findOrCreate({
      where: {
        user_id: req.user.id,
        category,
        month: currentMonth,
        year: currentYear
      },
      defaults: {
        planned_amount,
        spent_amount: 0
      }
    });

    if (!created) {
      budget.planned_amount = planned_amount;
      await budget.save();
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'Presupuesto creado exitosamente' : 'Presupuesto actualizado exitosamente',
      budget
    });
  } catch (error) {
    console.error('Error al guardar presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener sugerencias de ajuste automático
const getAdjustmentSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    // Obtener presupuestos actuales
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        is_active: true
      }
    });

    const suggestions = [];

    for (const budget of budgets) {
      // Calcular promedio de gastos de los últimos 3 meses
      const lastThreeMonths = [];
      for (let i = 1; i <= 3; i++) {
        const targetDate = moment().subtract(i, 'months');
        const monthStart = targetDate.startOf('month');
        const monthEnd = targetDate.endOf('month');

        const monthlySpending = await Transaction.sum('amount', {
          where: {
            user_id: userId,
            category: budget.category,
            type: 'expense',
            date: {
              [Op.between]: [monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD')]
            }
          }
        });

        lastThreeMonths.push(monthlySpending || 0);
      }

      const averageSpending = lastThreeMonths.reduce((sum, amount) => sum + amount, 0) / 3;
      const currentBudget = parseFloat(budget.planned_amount);
      const difference = averageSpending - currentBudget;
      const percentageChange = (difference / currentBudget) * 100;

      // Solo sugerir si la diferencia es significativa (>5%)
      if (Math.abs(percentageChange) > 5) {
        let reason = '';
        if (difference > 0) {
          reason = `Patrón de gasto aumentó ${percentageChange.toFixed(1)}% en últimos 3 meses`;
        } else {
          reason = `Gastos menores al presupuesto por 3 meses consecutivos`;
        }

        suggestions.push({
          category: budget.category,
          current: currentBudget,
          suggested: Math.round(averageSpending),
          reason,
          confidence: Math.min(90, 70 + Math.abs(percentageChange))
        });
      }
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar presupuesto
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!budget) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    await budget.destroy();

    res.json({ message: 'Presupuesto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getBudgets,
  upsertBudget,
  getAdjustmentSuggestions,
  deleteBudget
};