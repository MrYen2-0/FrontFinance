const { Transaction, Budget } = require('../models');
const { generatePredictionsForUser } = require('../utils/predictions');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener predicciones de gastos usando el motor de predicciones
const getPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 3 } = req.query;

    const predictions = await generatePredictionsForUser(userId, {
      monthsAhead: parseInt(months)
    });

    res.json(predictions);
  } catch (error) {
    console.error('Error al generar predicciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener insights y consejos
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    // Obtener transacciones del mes actual
    const startDate = moment().startOf('month');
    const endDate = moment().endOf('month');

    const currentMonthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      }
    });

    // Analizar patrones de gasto
    const insights = [];

    // 1. Análisis de gastos por día de la semana
    const daySpending = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const dayOfWeek = moment(transaction.date).format('dddd');
        daySpending[dayOfWeek] = (daySpending[dayOfWeek] || 0) + parseFloat(transaction.amount);
      });

    const weekendSpending = (daySpending['Saturday'] || 0) + (daySpending['Sunday'] || 0);
    const weekdaySpending = Object.entries(daySpending)
      .filter(([day]) => !['Saturday', 'Sunday'].includes(day))
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (weekendSpending > weekdaySpending * 0.4) {
      insights.push({
        type: 'pattern',
        title: 'Patrón de gasto detectado',
        description: 'Gastas significativamente más los fines de semana. Considera planificar un presupuesto específico para estos días.',
        impact: 'medium',
        category: 'spending_pattern',
        icon: 'TrendingUp'
      });
    }

    // 2. Categorías con mayor crecimiento
    const lastMonth = moment().subtract(1, 'months');
    const lastMonthStart = lastMonth.startOf('month');
    const lastMonthEnd = lastMonth.endOf('month');

    const lastMonthTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        type: 'expense',
        date: {
          [Op.between]: [lastMonthStart.format('YYYY-MM-DD'), lastMonthEnd.format('YYYY-MM-DD')]
        }
      }
    });

    // Comparar gastos por categoría
    const currentCategorySpending = {};
    const lastCategorySpending = {};

    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        currentCategorySpending[t.category] = (currentCategorySpending[t.category] || 0) + parseFloat(t.amount);
      });

    lastMonthTransactions.forEach(t => {
      lastCategorySpending[t.category] = (lastCategorySpending[t.category] || 0) + parseFloat(t.amount);
    });

    Object.entries(currentCategorySpending).forEach(([category, currentAmount]) => {
      const lastAmount = lastCategorySpending[category] || 0;
      if (lastAmount > 0) {
        const change = ((currentAmount - lastAmount) / lastAmount) * 100;
        if (change > 20) {
          insights.push({
            type: 'alert',
            title: `Aumento en ${category}`,
            description: `Tus gastos en ${category} aumentaron ${change.toFixed(1)}% este mes.`,
            impact: 'high',
            category: 'budget_alert',
            icon: 'AlertTriangle'
          });
        } else if (change < -20) {
          insights.push({
            type: 'positive',
            title: `Ahorro en ${category}`,
            description: `¡Genial! Redujiste tus gastos en ${category} un ${Math.abs(change).toFixed(1)}% este mes.`,
            impact: 'positive',
            category: 'savings_opportunity',
            icon: 'TrendingUp'
          });
        }
      }
    });

    // 3. Comparación con presupuesto
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        is_active: true
      }
    });

    budgets.forEach(budget => {
      const categorySpending = currentCategorySpending[budget.category] || 0;
      const budgetAmount = parseFloat(budget.planned_amount);
      const usagePercentage = (categorySpending / budgetAmount) * 100;

      if (usagePercentage > 90) {
        insights.push({
          type: 'warning',
          title: `Presupuesto casi agotado: ${budget.category}`,
          description: `Has usado ${usagePercentage.toFixed(1)}% de tu presupuesto en ${budget.category}.`,
          impact: 'high',
          category: 'budget_warning',
          icon: 'AlertTriangle'
        });
      } else if (usagePercentage < 50 && moment().date() > 20) {
        insights.push({
          type: 'positive',
          title: `Buen control en ${budget.category}`,
          description: `Solo has usado ${usagePercentage.toFixed(1)}% de tu presupuesto en ${budget.category}. ¡Excelente control!`,
          impact: 'positive',
          category: 'budget_success',
          icon: 'CheckCircle'
        });
      }
    });

    // 4. Análisis de frecuencia de transacciones
    const transactionsByDay = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const day = moment(transaction.date).date();
        transactionsByDay[day] = (transactionsByDay[day] || 0) + 1;
      });

    const avgTransactionsPerDay = Object.values(transactionsByDay).reduce((sum, count) => sum + count, 0) / Object.keys(transactionsByDay).length;
    const highSpendingDays = Object.entries(transactionsByDay).filter(([day, count]) => count > avgTransactionsPerDay * 1.5);

    if (highSpendingDays.length > 0) {
      const daysText = highSpendingDays.map(([day]) => day).join(', ');
      insights.push({
        type: 'info',
        title: 'Días de mayor actividad',
        description: `Los días ${daysText} tuviste más transacciones de lo normal. Revisa si estos patrones se repiten.`,
        impact: 'low',
        category: 'spending_frequency',
        icon: 'Calendar'
      });
    }

    // 5. Comparación con meses anteriores (promedio de últimos 3 meses)
    const threeMonthsAgo = moment().subtract(3, 'months').startOf('month');
    const lastMonthEndDate = moment().subtract(1, 'months').endOf('month');

    const historicalTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        type: 'expense',
        date: {
          [Op.between]: [threeMonthsAgo.format('YYYY-MM-DD'), lastMonthEndDate.format('YYYY-MM-DD')]
        }
      }
    });

    const historicalTotal = historicalTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const historicalAverage = historicalTotal / 3; // 3 meses
    const currentTotal = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (currentTotal > historicalAverage * 1.15) {
      const increase = ((currentTotal - historicalAverage) / historicalAverage) * 100;
      insights.push({
        type: 'warning',
        title: 'Gastos por encima del promedio',
        description: `Este mes has gastado ${increase.toFixed(1)}% más que tu promedio de los últimos 3 meses.`,
        impact: 'medium',
        category: 'historical_comparison',
        icon: 'TrendingUp'
      });
    } else if (currentTotal < historicalAverage * 0.85) {
      const decrease = ((historicalAverage - currentTotal) / historicalAverage) * 100;
      insights.push({
        type: 'positive',
        title: 'Gastos por debajo del promedio',
        description: `¡Excelente! Este mes has gastado ${decrease.toFixed(1)}% menos que tu promedio histórico.`,
        impact: 'positive',
        category: 'historical_comparison',
        icon: 'TrendingDown'
      });
    }

    res.json({ 
      insights,
      summary: {
        total_insights: insights.length,
        alerts: insights.filter(i => i.type === 'alert' || i.type === 'warning').length,
        positive: insights.filter(i => i.type === 'positive').length,
        generated_at: moment().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al generar insights:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener análisis de tendencias
const getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '6months' } = req.query;

    let monthsBack = 6;
    if (period === '3months') monthsBack = 3;
    if (period === '12months') monthsBack = 12;

    const startDate = moment().subtract(monthsBack, 'months').startOf('month');
    const endDate = moment().endOf('month');

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      },
      order: [['date', 'ASC']]
    });

    // Agrupar por mes
    const monthlyData = {};
    transactions.forEach(transaction => {
      const monthKey = moment(transaction.date).format('YYYY-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, savings: 0, transactions: 0 };
      }
      
      const amount = parseFloat(transaction.amount);
      monthlyData[monthKey].transactions += 1;
      
      if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += amount;
      } else {
        monthlyData[monthKey].income += amount;
      }
    });

    // Calcular ahorros y tendencias
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].savings = monthlyData[month].income - monthlyData[month].expenses;
    });

    // Formatear para el frontend
    const trends = Object.entries(monthlyData)
      .sort((a, b) => moment(a[0]).diff(moment(b[0])))
      .map(([month, data]) => ({
        month: moment(month).format('MMMM YYYY'),
        month_short: moment(month).format('MMM'),
        income: Math.round(data.income),
        expenses: Math.round(data.expenses),
        savings: Math.round(data.savings),
        savings_rate: data.income > 0 ? Math.round((data.savings / data.income) * 100) : 0,
        transaction_count: data.transactions
      }));

    // Calcular estadísticas y tendencias
    const totalMonths = trends.length;
    if (totalMonths === 0) {
      return res.json({
        trends: [],
        statistics: {},
        message: 'No hay datos suficientes para generar tendencias'
      });
    }

    const avgIncome = trends.reduce((sum, t) => sum + t.income, 0) / totalMonths;
    const avgExpenses = trends.reduce((sum, t) => sum + t.expenses, 0) / totalMonths;
    const avgSavings = trends.reduce((sum, t) => sum + t.savings, 0) / totalMonths;
    const avgSavingsRate = trends.reduce((sum, t) => sum + t.savings_rate, 0) / totalMonths;

    // Calcular tendencias (pendiente de la recta de regresión)
    const calculateTrend = (values) => {
      const n = values.length;
      if (n < 2) return 0;
      
      const sumX = values.reduce((sum, _, i) => sum + i, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
      const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      return slope;
    };

    const expenseValues = trends.map(t => t.expenses);
    const incomeValues = trends.map(t => t.income);
    const savingsValues = trends.map(t => t.savings);

    const expenseTrend = calculateTrend(expenseValues);
    const incomeTrend = calculateTrend(incomeValues);
    const savingsTrend = calculateTrend(savingsValues);

    res.json({
      trends,
      statistics: {
        average_income: Math.round(avgIncome),
        average_expenses: Math.round(avgExpenses),
        average_savings: Math.round(avgSavings),
        average_savings_rate: Math.round(avgSavingsRate),
        total_months: totalMonths,
        period: period,
        trends: {
          expenses: expenseTrend > 5 ? 'increasing' : expenseTrend < -5 ? 'decreasing' : 'stable',
          income: incomeTrend > 5 ? 'increasing' : incomeTrend < -5 ? 'decreasing' : 'stable',
          savings: savingsTrend > 5 ? 'increasing' : savingsTrend < -5 ? 'decreasing' : 'stable'
        },
        trend_analysis: {
          expense_trend: expenseTrend,
          income_trend: incomeTrend,
          savings_trend: savingsTrend
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener análisis comparativo de categorías
const getCategoryAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;

    const startDate = moment().subtract(parseInt(months), 'months').startOf('month');
    const endDate = moment().endOf('month');

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        type: 'expense',
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      }
    });

    // Agrupar por categoría y mes
    const categoryData = {};
    transactions.forEach(transaction => {
      const category = transaction.category;
      const monthKey = moment(transaction.date).format('YYYY-MM');
      const amount = parseFloat(transaction.amount);

      if (!categoryData[category]) {
        categoryData[category] = {};
      }
      if (!categoryData[category][monthKey]) {
        categoryData[category][monthKey] = 0;
      }
      
      categoryData[category][monthKey] += amount;
    });

    // Analizar cada categoría
    const analysis = Object.entries(categoryData).map(([category, monthlyData]) => {
      const values = Object.values(monthlyData);
      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      // Calcular variabilidad
      const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const variability = average > 0 ? (stdDev / average) * 100 : 0;

      // Tendencia
      const calculateTrend = (vals) => {
        const n = vals.length;
        if (n < 2) return 0;
        
        const sumX = vals.reduce((sum, _, i) => sum + i, 0);
        const sumY = vals.reduce((sum, val) => sum + val, 0);
        const sumXY = vals.reduce((sum, val, i) => sum + (i * val), 0);
        const sumXX = vals.reduce((sum, _, i) => sum + (i * i), 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      };

      const trend = calculateTrend(values);
      const trendPercentage = average > 0 ? (trend / average) * 100 : 0;

      return {
        category,
        total: Math.round(total),
        average: Math.round(average),
        max: Math.round(max),
        min: Math.round(min),
        variability: Math.round(variability),
        trend_direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        trend_percentage: Math.round(trendPercentage),
        months_with_data: values.length,
        consistency: variability < 20 ? 'high' : variability < 40 ? 'medium' : 'low'
      };
    }).sort((a, b) => b.total - a.total);

    res.json({
      category_analysis: analysis,
      summary: {
        total_categories: analysis.length,
        period_months: parseInt(months),
        most_spent_category: analysis[0]?.category || 'N/A',
        most_variable_category: analysis.reduce((prev, curr) => 
          curr.variability > prev.variability ? curr : prev, analysis[0] || {})?.category || 'N/A',
        most_consistent_category: analysis.reduce((prev, curr) => 
          curr.variability < prev.variability ? curr : prev, analysis[0] || {})?.category || 'N/A'
      }
    });
  } catch (error) {
    console.error('Error al obtener análisis de categorías:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getPredictions,
  getInsights,
  getTrends,
  getCategoryAnalysis
};