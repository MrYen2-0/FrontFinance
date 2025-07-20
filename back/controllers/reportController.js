// back/controllers/reportController.js
const { Transaction, Budget, Goal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');

// Obtener datos del dashboard
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    // Obtener resumen de transacciones del mes actual
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();
    
    const monthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [monthStart, monthEnd]
        }
      }
    });
    
    // Calcular totales
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};
    
    monthTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      }
    });
    
    // Obtener presupuestos del mes
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear
      }
    });
    
    // Obtener metas activas
    const goals = await Goal.findAll({
      where: {
        user_id: userId,
        is_completed: false
      }
    });
    
    // Calcular estadísticas de metas
    const totalGoals = goals.length;
    const completedGoals = await Goal.count({
      where: {
        user_id: userId,
        is_completed: true
      }
    });
    
    const goalProgress = goals.map(g => ({
      id: g.id,
      name: g.name,
      progress: (parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100,
      daysLeft: moment(g.deadline).diff(moment(), 'days')
    }));
    
    // Tendencia de gastos (últimos 7 días) - Simplificado
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dayTransactions = monthTransactions.filter(t => 
        moment(t.date).isSame(date, 'day') && t.type === 'expense'
      );
      
      const dayTotal = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      weeklyTrend.push({
        day: date.format('YYYY-MM-DD'),
        total: dayTotal
      });
    }
    
    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      },
      categoryBreakdown: Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      })),
      budgetStatus: budgets.map(b => ({
        category: b.category,
        planned: parseFloat(b.planned_amount),
        spent: parseFloat(b.spent_amount || 0),
        percentage: parseFloat(b.planned_amount) > 0 ? 
          (parseFloat(b.spent_amount || 0) / parseFloat(b.planned_amount)) * 100 : 0
      })),
      goalsOverview: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: totalGoals,
        topGoals: goalProgress.sort((a, b) => b.progress - a.progress).slice(0, 3)
      },
      weeklyTrend,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ 
      message: 'Error al cargar dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener datos para reportes
const getReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const start = startDate ? moment(startDate).toDate() : moment().subtract(6, 'months').toDate();
    const end = endDate ? moment(endDate).toDate() : moment().toDate();
    
    // Obtener todas las transacciones del período
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [start, end] }
      },
      order: [['date', 'DESC']]
    });
    
    // Agrupar datos según el parámetro
    const groupedData = {};
    const categoryData = {};
    
    transactions.forEach(t => {
      // Agrupar por período
      let periodKey;
      switch (groupBy) {
        case 'day':
          periodKey = moment(t.date).format('YYYY-MM-DD');
          break;
        case 'week':
          periodKey = moment(t.date).format('YYYY-WW');
          break;
        case 'year':
          periodKey = moment(t.date).format('YYYY');
          break;
        default: // month
          periodKey = moment(t.date).format('YYYY-MM');
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          income: 0,
          expenses: 0,
          transactions: []
        };
      }
      
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        groupedData[periodKey].income += amount;
      } else {
        groupedData[periodKey].expenses += amount;
      }
      groupedData[periodKey].transactions.push(t);
      
      // Agrupar por categoría
      if (!categoryData[t.category]) {
        categoryData[t.category] = {
          total: 0,
          income: 0,
          expenses: 0,
          count: 0
        };
      }
      
      categoryData[t.category].total += amount;
      categoryData[t.category].count += 1;
      if (t.type === 'income') {
        categoryData[t.category].income += amount;
      } else {
        categoryData[t.category].expenses += amount;
      }
    });
    
    // Convertir a arrays y calcular estadísticas
    const timeSeriesData = Object.entries(groupedData).map(([period, data]) => ({
      period,
      income: data.income,
      expenses: data.expenses,
      profit: data.income - data.expenses,
      transactionCount: data.transactions.length
    })).sort((a, b) => a.period.localeCompare(b.period));
    
    const categoryAnalysis = Object.entries(categoryData).map(([category, data]) => ({
      category,
      total: data.total,
      income: data.income,
      expenses: data.expenses,
      count: data.count,
      average: data.total / data.count
    })).sort((a, b) => b.total - a.total);
    
    // Calcular estadísticas generales
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        averageTransaction: transactions.length > 0 ? 
          (totalIncome + totalExpenses) / transactions.length : 0,
        transactionCount: transactions.length
      },
      timeSeriesData,
      categoryAnalysis,
      topTransactions: transactions
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          date: t.date,
          category: t.category,
          description: t.description,
          amount: parseFloat(t.amount),
          type: t.type
        })),
      period: {
        start,
        end,
        groupBy
      }
    });
  } catch (error) {
    console.error('Error en reportes:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Comparar períodos
const getPeriodsComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      period1Start = moment().subtract(2, 'months').startOf('month').format('YYYY-MM-DD'),
      period1End = moment().subtract(2, 'months').endOf('month').format('YYYY-MM-DD'),
      period2Start = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      period2End = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
    } = req.query;
    
    // Período 1
    const transactions1 = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [period1Start, period1End] }
      }
    });
    
    // Período 2
    const transactions2 = await Transaction.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [period2Start, period2End] }
      }
    });
    
    // Calcular estadísticas para cada período
    const calculateStats = (transactions) => {
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const categoryBreakdown = {};
      transactions.forEach(t => {
        if (!categoryBreakdown[t.category]) {
          categoryBreakdown[t.category] = 0;
        }
        categoryBreakdown[t.category] += parseFloat(t.amount);
      });
      
      return {
        income,
        expenses,
        profit: income - expenses,
        transactionCount: transactions.length,
        categoryBreakdown
      };
    };
    
    const stats1 = calculateStats(transactions1);
    const stats2 = calculateStats(transactions2);
    
    // Calcular diferencias
    const comparison = {
      income: {
        period1: stats1.income,
        period2: stats2.income,
        difference: stats2.income - stats1.income,
        percentageChange: stats1.income > 0 ? 
          ((stats2.income - stats1.income) / stats1.income) * 100 : 0
      },
      expenses: {
        period1: stats1.expenses,
        period2: stats2.expenses,
        difference: stats2.expenses - stats1.expenses,
        percentageChange: stats1.expenses > 0 ? 
          ((stats2.expenses - stats1.expenses) / stats1.expenses) * 100 : 0
      },
      profit: {
        period1: stats1.profit,
        period2: stats2.profit,
        difference: stats2.profit - stats1.profit,
        percentageChange: stats1.profit !== 0 ? 
          ((stats2.profit - stats1.profit) / Math.abs(stats1.profit)) * 100 : 0
      },
      categoryComparison: {}
    };
    
    // Comparar categorías
    const allCategories = new Set([
      ...Object.keys(stats1.categoryBreakdown),
      ...Object.keys(stats2.categoryBreakdown)
    ]);
    
    allCategories.forEach(category => {
      const amount1 = stats1.categoryBreakdown[category] || 0;
      const amount2 = stats2.categoryBreakdown[category] || 0;
      
      comparison.categoryComparison[category] = {
        period1: amount1,
        period2: amount2,
        difference: amount2 - amount1,
        percentageChange: amount1 > 0 ? ((amount2 - amount1) / amount1) * 100 : 0
      };
    });
    
    res.json({
      period1: {
        start: period1Start,
        end: period1End,
        stats: stats1
      },
      period2: {
        start: period2Start,
        end: period2End,
        stats: stats2
      },
      comparison
    });
  } catch (error) {
    console.error('Error en comparación:', error);
    res.status(500).json({ 
      message: 'Error al comparar períodos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardData,
  getReportData,
  getPeriodsComparison
};