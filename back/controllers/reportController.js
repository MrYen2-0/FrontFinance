// back/controllers/reportController.js
const { Transaction, Budget, Goal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');

// Obtener dashboard data (resumen para pantalla principal)
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = moment().startOf('month');
    const currentMonthEnd = moment().endOf('month');

    // Transacciones del mes actual
    const monthlyTransactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [currentMonth.format('YYYY-MM-DD'), currentMonthEnd.format('YYYY-MM-DD')]
        }
      },
      order: [['date', 'DESC']],
      limit: 10
    });

    // Presupuestos del mes con gastos reales
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: moment().month() + 1,
        year: moment().year(),
        is_active: true
      }
    });

    // Calcular gastos reales para cada presupuesto
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const actualSpending = await Transaction.sum('amount', {
          where: {
            user_id: userId,
            category: budget.category,
            type: 'expense',
            date: {
              [Op.between]: [currentMonth.format('YYYY-MM-DD'), currentMonthEnd.format('YYYY-MM-DD')]
            }
          }
        });

        const spent = actualSpending || 0;
        const planned = parseFloat(budget.planned_amount);
        const remaining = Math.max(planned - spent, 0);

        return {
          id: budget.id,
          category: budget.category,
          planned,
          spent,
          remaining,
          percentage: planned > 0 ? Math.round((spent / planned) * 100) : 0
        };
      })
    );

    // Metas activas
    const goals = await Goal.findAll({
      where: {
        user_id: userId,
        status: 'active'
      },
      order: [['deadline', 'ASC']],
      limit: 5
    });

    // Calcular estadísticas del mes
    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Estadísticas generales
    const completedGoals = await Goal.count({
      where: { user_id: userId, status: 'completed' }
    });

    const totalGoals = await Goal.count({
      where: { user_id: userId }
    });

    const totalSaved = await Goal.sum('current_amount', {
      where: { user_id: userId }
    }) || 0;

    // Respuesta estructurada
    res.json({
      stats: {
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        balance: Math.round(totalIncome - totalExpenses),
        completedGoals,
        totalGoals,
        totalSaved: Math.round(totalSaved)
      },
      recentTransactions: monthlyTransactions.slice(0, 5).map(t => ({
        id: t.id,
        type: t.type,
        category: t.category,
        amount: parseFloat(t.amount),
        description: t.description,
        date: t.date
      })),
      budgets: budgetsWithSpending.slice(0, 3),
      goals: goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        target: parseFloat(goal.target_amount),
        current: parseFloat(goal.current_amount),
        progress: Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100),
        deadline: goal.deadline,
        category: goal.category
      }))
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// Obtener datos para reportes
// Obtener datos para reportes visuales
const getReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;

    console.log('Generando reporte para usuario:', userId, 'período:', period);

    let dateRange = {};
    
    // Definir rango de fechas basado en el período
    switch (period) {
      case 'week':
        dateRange = {
          start: moment().startOf('week'),
          end: moment().endOf('week')
        };
        break;
      case 'month':
        dateRange = {
          start: moment().startOf('month'),
          end: moment().endOf('month')
        };
        break;
      case '3months':
        dateRange = {
          start: moment().subtract(3, 'months').startOf('month'),
          end: moment().endOf('month')
        };
        break;
      case '6months':
        dateRange = {
          start: moment().subtract(6, 'months').startOf('month'),
          end: moment().endOf('month')
        };
        break;
      case 'year':
        dateRange = {
          start: moment().startOf('year'),
          end: moment().endOf('year')
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateRange = {
            start: moment(startDate),
            end: moment(endDate)
          };
        } else {
          return res.status(400).json({ message: 'Fechas de inicio y fin requeridas para período personalizado' });
        }
        break;
      default:
        dateRange = {
          start: moment().startOf('month'),
          end: moment().endOf('month')
        };
    }

    // Obtener transacciones del período
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [dateRange.start.format('YYYY-MM-DD'), dateRange.end.format('YYYY-MM-DD')]
        }
      },
      order: [['date', 'ASC']]
    });

    console.log('Transacciones encontradas:', transactions.length);

    // Si no hay transacciones, crear datos de ejemplo
    if (transactions.length === 0) {
      return res.json({
        summary: {
          totalIngresos: 0,
          totalGastado: 0,
          balance: 0,
          categoriaTop: 'Sin datos',
          promedioSemanal: 0,
          transactionCount: 0
        },
        gastosDelMes: [],
        distribucionGastos: [],
        ultimos6Meses: [],
        dineroDelMes: [],
        recentTransactions: [],
        budgetComparison: []
      });
    }

    // 1. Gastos por categoría
    const expensesByCategory = {};
    const incomeByCategory = {};

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      const category = transaction.category;

      if (transaction.type === 'expense') {
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
      } else {
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      }
    });

    // 2. Datos mensuales para gráficas de tendencia
    const monthlyData = {};
    transactions.forEach(transaction => {
      const monthKey = moment(transaction.date).format('YYYY-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += amount;
      } else {
        monthlyData[monthKey].income += amount;
      }
    });

    // 3. Datos semanales para el mes actual
    const weeklyData = {};
    const currentMonthTransactions = transactions.filter(t => 
      moment(t.date).isSame(moment(), 'month')
    );

    // Agrupar por semanas del mes
    const weeksInMonth = Math.ceil(moment().daysInMonth() / 7);
    for (let week = 1; week <= weeksInMonth; week++) {
      weeklyData[`Semana ${week}`] = { expenses: 0, income: 0, presupuesto: 300 }; // Presupuesto ejemplo
    }

    currentMonthTransactions.forEach(transaction => {
      const dayOfMonth = moment(transaction.date).date();
      const weekNumber = Math.ceil(dayOfMonth / 7);
      const weekKey = `Semana ${weekNumber}`;
      
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'expense') {
        weeklyData[weekKey].expenses += amount;
      } else {
        weeklyData[weekKey].income += amount;
      }
    });

    // 4. Calcular totales
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // 5. Obtener presupuestos para comparación
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        is_active: true
      }
    });

    const budgetByCategory = {};
    budgets.forEach(budget => {
      budgetByCategory[budget.category] = parseFloat(budget.planned_amount);
    });

    // 6. Formatear datos para el frontend
    const formattedData = {
      // Gastos por categoría (para gráfica de barras)
      gastosDelMes: Object.entries(expensesByCategory)
        .map(([categoria, cantidad]) => ({
          categoria,
          cantidad: Math.round(cantidad),
          transacciones: transactions.filter(t => t.category === categoria && t.type === 'expense').length
        }))
        .sort((a, b) => b.cantidad - a.cantidad),

      // Distribución de gastos (para gráfica de pastel)
      distribucionGastos: Object.entries(expensesByCategory)
        .map(([name, value]) => ({
          name,
          value: Math.round(value),
          percentage: Math.round((value / totalExpenses) * 100) || 0
        }))
        .sort((a, b) => b.value - a.value),

      // Datos de los últimos 6 meses
      ultimos6Meses: Object.entries(monthlyData)
        .map(([mes, data]) => ({
          mes: moment(mes, 'YYYY-MM').format('MMM'),
          gastos: Math.round(data.expenses),
          ingresos: Math.round(data.income)
        }))
        .sort((a, b) => moment(a.mes, 'MMM').month() - moment(b.mes, 'MMM').month())
        .slice(-6),

      // Gastos semanales del mes actual
      dineroDelMes: Object.entries(weeklyData)
        .map(([semana, data]) => ({
          semana,
          gaste: Math.round(data.expenses),
          presupuesto: data.presupuesto,
          ingresos: Math.round(data.income)
        })),

      // Transacciones recientes
      recentTransactions: transactions
        .slice(-10)
        .reverse()
        .map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          category: t.category,
          type: t.type,
          amount: parseFloat(t.amount)
        })),

      // Resumen general
      summary: {
        totalIngresos: Math.round(totalIncome),
        totalGastado: Math.round(totalExpenses),
        balance: Math.round(totalIncome - totalExpenses),
        categoriaTop: Object.keys(expensesByCategory).length > 0 ? 
          Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][0] : 'Sin datos',
        promedioSemanal: Math.round(totalExpenses / 4), // Aproximado
        transactionCount: transactions.length,
        period: {
          start: dateRange.start.format('YYYY-MM-DD'),
          end: dateRange.end.format('YYYY-MM-DD'),
          type: period
        }
      },

      // Comparación con presupuesto
      budgetComparison: Object.entries(expensesByCategory).map(([categoria, gastado]) => ({
        categoria,
        gastado: Math.round(gastado),
        presupuestado: Math.round(budgetByCategory[categoria] || 0),
        diferencia: Math.round((budgetByCategory[categoria] || 0) - gastado),
        porcentajeUsado: budgetByCategory[categoria] ? 
          Math.round((gastado / budgetByCategory[categoria]) * 100) : 0
      }))
    };

    console.log('Datos formateados enviados:', {
      gastosDelMes: formattedData.gastosDelMes.length,
      totalGastado: formattedData.summary.totalGastado,
      totalIngresos: formattedData.summary.totalIngresos
    });

    res.json(formattedData);
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
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