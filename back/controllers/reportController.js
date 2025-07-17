const { Transaction, Budget, Goal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener datos para reportes visuales
const getReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month', startDate, endDate } = req.query;

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
      weeklyData[`Semana ${week}`] = { expenses: 0, income: 0 };
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

    // 6. Formatear datos para las gráficas del frontend
    const formattedData = {
      // Para gráfica de barras de categorías
      gastosDelMes: Object.entries(expensesByCategory)
        .map(([categoria, cantidad]) => ({
          categoria,
          cantidad: Math.round(cantidad)
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10), // Top 10 categorías

      // Para gráfica de comparación semanal
      dineroDelMes: Object.entries(weeklyData).map(([semana, data]) => ({
        semana,
        gaste: Math.round(data.expenses),
        presupuesto: Math.round(
          Object.values(budgetByCategory).reduce((sum, amount) => sum + amount, 0) / 4
        ) || 650 // Promedio semanal del presupuesto total
      })),

      // Para gráfica de tendencia mensual (últimos 6 meses)
      ultimos6Meses: Object.entries(monthlyData)
        .sort((a, b) => moment(a[0]).diff(moment(b[0])))
        .slice(-6) // Solo últimos 6 meses
        .map(([mes, data]) => ({
          mes: moment(mes).format('MMM'),
          gastos: Math.round(data.expenses),
          ingresos: Math.round(data.income)
        })),

      // Para gráfica de pastel con porcentajes
      distribucionGastos: Object.entries(expensesByCategory)
        .map(([categoria, cantidad]) => ({
          name: categoria,
          value: Math.round(cantidad),
          percentage: Math.round((cantidad / totalExpenses) * 100)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6), // Top 6 categorías

      // Resumen general
      summary: {
        totalGastado: Math.round(totalExpenses),
        totalIngresos: Math.round(totalIncome),
        balance: Math.round(totalIncome - totalExpenses),
        promedioSemanal: Math.round(totalExpenses / Math.max(1, moment(dateRange.end).diff(dateRange.start, 'weeks'))),
        categoriaTop: Object.entries(expensesByCategory).length > 0 ? 
          Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][0] : 'Ninguna',
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

    res.json(formattedData);
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

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
        const remaining = planned - spent;

        return {
          id: budget.id,
          category: budget.category,
          planned,
          spent,
          remaining: Math.max(remaining, 0)
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
    });

    res.json({
      stats: {
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        balance: Math.round(totalIncome - totalExpenses),
        completedGoals,
        totalGoals,
        totalSaved: Math.round(totalSaved || 0)
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
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener comparación de períodos
const getPeriodsComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periods = 'month' } = req.query; // 'month', 'quarter', 'year'

    let comparisons = [];
    
    if (periods === 'month') {
      // Comparar últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const monthStart = moment().subtract(i, 'months').startOf('month');
        const monthEnd = moment().subtract(i, 'months').endOf('month');
        
        const monthTransactions = await Transaction.findAll({
          where: {
            user_id: userId,
            date: {
              [Op.between]: [monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD')]
            }
          }
        });

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        comparisons.push({
          period: monthStart.format('MMMM YYYY'),
          income: Math.round(income),
          expenses: Math.round(expenses),
          balance: Math.round(income - expenses),
          transactionCount: monthTransactions.length
        });
      }
    }

    res.json({
      type: periods,
      comparisons: comparisons.reverse() // Orden cronológico
    });
  } catch (error) {
    console.error('Error al generar comparación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getReportData,
  getDashboardData,
  getPeriodsComparison
};