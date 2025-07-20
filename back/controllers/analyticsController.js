// back/controllers/analyticsController.js
const { Transaction, Budget, Goal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener predicciones
const getPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    // Obtener transacciones de los últimos 3 meses
    const threeMonthsAgo = moment().subtract(3, 'months').startOf('day');
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: threeMonthsAgo }
      }
    });

    // Si no hay transacciones, devolver predicciones vacías
    if (transactions.length === 0) {
      return res.json({
        predictions: {
          next_month_expenses: 0,
          savings_rate: 0,
          budget_health: 'no_data',
          unusual_expenses: [],
          avg_monthly_income: 0,
          avg_monthly_expenses: 0
        }
      });
    }

    // Calcular gastos promedio mensual
    const monthlyExpenses = {};
    const monthlyIncome = {};
    
    transactions.forEach(t => {
      const month = moment(t.date).format('YYYY-MM');
      if (t.type === 'expense') {
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + parseFloat(t.amount);
      } else {
        monthlyIncome[month] = (monthlyIncome[month] || 0) + parseFloat(t.amount);
      }
    });

    // Calcular promedios
    const avgMonthlyExpenses = Object.keys(monthlyExpenses).length > 0 
      ? Object.values(monthlyExpenses).reduce((a, b) => a + b, 0) / Object.keys(monthlyExpenses).length 
      : 0;
    
    const avgMonthlyIncome = Object.keys(monthlyIncome).length > 0
      ? Object.values(monthlyIncome).reduce((a, b) => a + b, 0) / Object.keys(monthlyIncome).length
      : 0;
    
    // Calcular tasa de ahorro
    const savingsRate = avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100 : 0;
    
    // Detectar gastos inusuales
    const categoryExpenses = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!categoryExpenses[t.category]) {
          categoryExpenses[t.category] = [];
        }
        categoryExpenses[t.category].push(parseFloat(t.amount));
      });
    
    const unusualExpenses = [];
    Object.entries(categoryExpenses).forEach(([category, amounts]) => {
      if (amounts.length > 1) {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const max = Math.max(...amounts);
        if (max > avg * 1.5) {
          unusualExpenses.push({
            category,
            amount: max,
            average: avg,
            reason: `${((max / avg - 1) * 100).toFixed(0)}% más alto que el promedio`
          });
        }
      }
    });

    // Determinar salud del presupuesto
    let budgetHealth = 'healthy';
    if (savingsRate < 10) budgetHealth = 'critical';
    else if (savingsRate < 20) budgetHealth = 'warning';

    res.json({
      predictions: {
        next_month_expenses: avgMonthlyExpenses * 1.05, // 5% de inflación estimada
        savings_rate: savingsRate,
        budget_health: budgetHealth,
        unusual_expenses: unusualExpenses,
        avg_monthly_income: avgMonthlyIncome,
        avg_monthly_expenses: avgMonthlyExpenses
      }
    });
  } catch (error) {
    console.error('Error en predicciones:', error);
    res.status(500).json({ 
      message: 'Error al generar predicciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener insights
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = [];
    
    // Obtener transacciones del último mes
    const lastMonth = moment().subtract(1, 'month').startOf('month');
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: lastMonth.toDate() }
      }
    });
    
    if (transactions.length > 0) {
      // Categoría con mayor gasto
      const categoryTotals = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
        });
      
      const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a);
      if (sortedCategories.length > 0) {
        const [topCategory, amount] = sortedCategories[0];
        insights.push({
          type: 'warning',
          title: 'Mayor gasto del mes',
          description: `${topCategory} representa tu mayor gasto con $${amount.toFixed(2)}`,
          action: 'Optimizar gastos'
        });
      }
    }
    
    // Análisis de presupuestos
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear
      }
    });
    
    const overBudget = budgets.filter(b => 
      parseFloat(b.spent_amount || 0) > parseFloat(b.planned_amount)
    );
    
    if (overBudget.length > 0) {
      insights.push({
        type: 'error',
        title: 'Presupuestos excedidos',
        description: `${overBudget.length} categorías han excedido su presupuesto`,
        action: 'Revisar presupuestos'
      });
    }
    
    // Análisis de metas
    const goals = await Goal.findAll({
      where: { 
        user_id: userId, 
        is_completed: false 
      }
    });
    
    if (goals.length > 0) {
      const avgProgress = goals.reduce((sum, g) => {
        const current = parseFloat(g.current_amount || 0);
        const target = parseFloat(g.target_amount || 1);
        return sum + (current / target);
      }, 0) / goals.length;
      
      insights.push({
        type: 'info',
        title: 'Progreso de metas',
        description: `Tienes ${goals.length} metas activas con ${(avgProgress * 100).toFixed(0)}% de progreso promedio`,
        action: 'Ver metas'
      });
    }
    
    // Si no hay insights, agregar uno por defecto
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Comienza a registrar',
        description: 'Agrega más transacciones para obtener insights personalizados sobre tus finanzas',
        action: 'Agregar transacción'
      });
    }
    
    res.json({ insights });
  } catch (error) {
    console.error('Error en insights:', error);
    res.status(500).json({ 
      message: 'Error al generar insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener tendencias
const getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    let startDate;
    let groupFormat;
    
    switch (period) {
      case 'week':
        startDate = moment().subtract(7, 'weeks');
        groupFormat = 'YYYY-WW';
        break;
      case 'year':
        startDate = moment().subtract(12, 'months');
        groupFormat = 'YYYY-MM';
        break;
      default: // month
        startDate = moment().subtract(6, 'months');
        groupFormat = 'YYYY-MM';
    }
    
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: startDate.toDate() }
      },
      order: [['date', 'ASC']]
    });
    
    // Agrupar por período
    const periodData = {};
    transactions.forEach(t => {
      const periodKey = moment(t.date).format(groupFormat);
      if (!periodData[periodKey]) {
        periodData[periodKey] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        periodData[periodKey].income += parseFloat(t.amount);
      } else {
        periodData[periodKey].expenses += parseFloat(t.amount);
      }
    });
    
    // Convertir a array y agregar predicciones
    const trends = Object.entries(periodData).map(([periodKey, data], index, array) => {
      // Predicción simple basada en tendencia
      let predicted = data.expenses;
      if (index > 0) {
        const prevExpenses = array[index - 1][1].expenses;
        const growth = data.expenses > prevExpenses ? 1.05 : 0.95;
        predicted = data.expenses * growth;
      }
      
      return {
        period: moment(periodKey, groupFormat).format(period === 'month' ? 'MMM' : 'MMM DD'),
        income: data.income,
        expenses: data.expenses,
        predicted: predicted
      };
    });
    
    res.json({ trends });
  } catch (error) {
    console.error('Error en tendencias:', error);
    res.status(500).json({ 
      message: 'Error al generar tendencias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Análisis por categoría
const getCategoryAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 3 } = req.query;
    
    const startDate = moment().subtract(months, 'months').startOf('day');
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        type: 'expense',
        date: { [Op.gte]: startDate.toDate() }
      }
    });
    
    // Análisis por categoría
    const categoryData = {};
    transactions.forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      
      categoryData[t.category].total += parseFloat(t.amount);
      categoryData[t.category].count += 1;
      categoryData[t.category].transactions.push({
        amount: parseFloat(t.amount),
        date: t.date,
        description: t.description
      });
    });
    
    // Calcular estadísticas
    const analysis = Object.entries(categoryData).map(([category, data]) => {
      const amounts = data.transactions.map(t => t.amount);
      const average = data.total / data.count;
      const max = amounts.length > 0 ? Math.max(...amounts) : 0;
      const min = amounts.length > 0 ? Math.min(...amounts) : 0;
      
      return {
        category,
        total: data.total,
        average,
        max,
        min,
        count: data.count,
        percentage: 0 // Se calculará después
      };
    });
    
    // Calcular porcentajes
    const totalExpenses = analysis.reduce((sum, cat) => sum + cat.total, 0);
    if (totalExpenses > 0) {
      analysis.forEach(cat => {
        cat.percentage = (cat.total / totalExpenses) * 100;
      });
    }
    
    // Ordenar por total
    analysis.sort((a, b) => b.total - a.total);
    
    res.json({ 
      analysis,
      totalExpenses,
      period: `${months} meses`
    });
  } catch (error) {
    console.error('Error en análisis por categoría:', error);
    res.status(500).json({ 
      message: 'Error al generar análisis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPredictions,
  getInsights,
  getTrends,
  getCategoryAnalysis
};