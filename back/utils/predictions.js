const { Transaction, Budget } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Genera predicciones de gastos basadas en datos históricos
 */
class PredictionEngine {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Obtiene datos históricos para análisis
   */
  async getHistoricalData(monthsBack = 6) {
    const startDate = moment().subtract(monthsBack, 'months').startOf('month');
    const endDate = moment().endOf('month');

    const transactions = await Transaction.findAll({
      where: {
        user_id: this.userId,
        type: 'expense',
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      },
      order: [['date', 'ASC']]
    });

    return transactions;
  }

  /**
   * Agrupa transacciones por mes y categoría
   */
  groupByMonthAndCategory(transactions) {
    const grouped = {};

    transactions.forEach(transaction => {
      const monthKey = moment(transaction.date).format('YYYY-MM');
      const category = transaction.category;
      const amount = parseFloat(transaction.amount);

      if (!grouped[monthKey]) grouped[monthKey] = {};
      if (!grouped[monthKey][category]) grouped[monthKey][category] = 0;
      
      grouped[monthKey][category] += amount;
    });

    return grouped;
  }

  /**
   * Calcula tendencia usando regresión lineal simple
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Aplica factores estacionales
   */
  getSeasonalFactor(month) {
    const seasonalFactors = {
      1: 1.05,  // Enero - gastos post-navideños
      2: 0.95,  // Febrero - mes corto
      3: 1.0,   // Marzo - normal
      4: 1.0,   // Abril - normal
      5: 1.0,   // Mayo - normal
      6: 1.05,  // Junio - inicio de vacaciones
      7: 1.1,   // Julio - vacaciones
      8: 1.1,   // Agosto - vacaciones
      9: 1.0,   // Septiembre - vuelta a la normalidad
      10: 1.0,  // Octubre - normal
      11: 1.05, // Noviembre - pre-navidad
      12: 1.2   // Diciembre - navidad
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Genera predicciones mensuales
   */
  async generateMonthlyPredictions(monthsAhead = 3) {
    try {
      const historicalData = await this.getHistoricalData(6);
      const groupedData = this.groupByMonthAndCategory(historicalData);

      // Calcular totales mensuales
      const monthlyTotals = {};
      Object.entries(groupedData).forEach(([month, categories]) => {
        monthlyTotals[month] = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
      });

      const monthlyValues = Object.values(monthlyTotals);
      const averageMonthly = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length;
      const trend = this.calculateTrend(monthlyValues);

      const predictions = [];

      for (let i = 1; i <= monthsAhead; i++) {
        const futureDate = moment().add(i, 'months');
        const month = futureDate.month() + 1;
        const seasonalFactor = this.getSeasonalFactor(month);
        
        // Predicción base con tendencia
        let basePrediction = averageMonthly + (trend * (monthlyValues.length + i));
        
        // Aplicar factor estacional
        let finalPrediction = basePrediction * seasonalFactor;
        
        // Asegurar que no sea negativo
        finalPrediction = Math.max(finalPrediction, averageMonthly * 0.5);

        // Calcular confianza (menor a futuro)
        const confidence = Math.max(60, 90 - (i * 10));

        predictions.push({
          month: futureDate.format('MMMM YYYY'),
          month_short: futureDate.format('MMM'),
          predicted_amount: Math.round(finalPrediction),
          confidence: confidence,
          seasonal_factor: seasonalFactor,
          base_prediction: Math.round(basePrediction)
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error generando predicciones mensuales:', error);
      throw error;
    }
  }

  /**
   * Genera predicciones por categoría
   */
  async generateCategoryPredictions() {
    try {
      const historicalData = await this.getHistoricalData(6);
      const groupedData = this.groupByMonthAndCategory(historicalData);

      // Obtener todas las categorías únicas
      const allCategories = new Set();
      Object.values(groupedData).forEach(monthData => {
        Object.keys(monthData).forEach(category => allCategories.add(category));
      });

      const predictions = [];

      allCategories.forEach(category => {
        const categoryValues = [];
        
        // Recopilar valores históricos para esta categoría
        Object.keys(groupedData).sort().forEach(month => {
          const amount = groupedData[month][category] || 0;
          categoryValues.push(amount);
        });

        if (categoryValues.length === 0) return;

        const average = categoryValues.reduce((sum, val) => sum + val, 0) / categoryValues.length;
        const trend = this.calculateTrend(categoryValues);
        const lastValue = categoryValues[categoryValues.length - 1];

        // Predicción para el próximo mes
        let nextMonthPrediction = average;
        
        if (categoryValues.length > 1) {
          // Aplicar tendencia si hay suficientes datos
          nextMonthPrediction = lastValue + trend;
        }

        // No permitir valores negativos
        nextMonthPrediction = Math.max(nextMonthPrediction, 0);

        const trendPercentage = average > 0 ? ((nextMonthPrediction - average) / average) * 100 : 0;

        // Calcular confianza basada en consistencia de datos
        const variance = categoryValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / categoryValues.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = average > 0 ? Math.max(0, 100 - (stdDev / average) * 100) : 50;

        predictions.push({
          category,
          current_average: Math.round(average),
          predicted_next_month: Math.round(nextMonthPrediction),
          trend_percentage: trendPercentage.toFixed(1),
          confidence: Math.min(90, Math.max(50, consistencyScore)),
          data_points: categoryValues.length,
          last_month_amount: Math.round(lastValue)
        });
      });

      return predictions.sort((a, b) => b.current_average - a.current_average);
    } catch (error) {
      console.error('Error generando predicciones por categoría:', error);
      throw error;
    }
  }

  /**
   * Genera alertas y consejos basados en predicciones
   */
  async generateInsights() {
    try {
      const insights = [];
      const monthlyPredictions = await this.generateMonthlyPredictions(1);
      const categoryPredictions = await this.generateCategoryPredictions();

      // Insight sobre tendencia general
      if (monthlyPredictions.length > 0) {
        const nextMonthPrediction = monthlyPredictions[0];
        const currentMonthData = await this.getCurrentMonthSpending();
        
        if (nextMonthPrediction.predicted_amount > currentMonthData * 1.1) {
          insights.push({
            type: 'warning',
            title: 'Gastos en aumento',
            description: `Se prevé un aumento del ${((nextMonthPrediction.predicted_amount - currentMonthData) / currentMonthData * 100).toFixed(1)}% en gastos el próximo mes.`,
            impact: 'medium',
            category: 'spending_trend'
          });
        }
      }

      // Insights por categoría
      categoryPredictions.forEach(pred => {
        const trendValue = parseFloat(pred.trend_percentage);
        
        if (trendValue > 20) {
          insights.push({
            type: 'alert',
            title: `Alerta: ${pred.category}`,
            description: `Tus gastos en ${pred.category} están aumentando significativamente (${pred.trend_percentage}%).`,
            impact: 'high',
            category: 'category_alert'
          });
        } else if (trendValue < -15) {
          insights.push({
            type: 'positive',
            title: `Ahorro en ${pred.category}`,
            description: `¡Excelente! Has reducido gastos en ${pred.category} un ${Math.abs(trendValue).toFixed(1)}%.`,
            impact: 'positive',
            category: 'savings_achievement'
          });
        }
      });

      return insights;
    } catch (error) {
      console.error('Error generando insights:', error);
      throw error;
    }
  }

  /**
   * Obtiene gastos del mes actual
   */
  async getCurrentMonthSpending() {
    const startDate = moment().startOf('month');
    const endDate = moment().endOf('month');

    const total = await Transaction.sum('amount', {
      where: {
        user_id: this.userId,
        type: 'expense',
        date: {
          [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
        }
      }
    });

    return total || 0;
  }

  /**
   * Predice cuándo se alcanzará una meta de ahorro
   */
  async predictGoalCompletion(targetAmount, currentAmount = 0) {
    try {
      const historicalData = await this.getHistoricalData(6);
      const monthlyTotals = {};

      // Calcular gastos mensuales históricos
      historicalData.forEach(transaction => {
        const monthKey = moment(transaction.date).format('YYYY-MM');
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + parseFloat(transaction.amount);
      });

      // Obtener ingresos históricos para calcular ahorro promedio
      const incomeData = await Transaction.findAll({
        where: {
          user_id: this.userId,
          type: 'income',
          date: {
            [Op.gte]: moment().subtract(6, 'months').startOf('month').format('YYYY-MM-DD')
          }
        }
      });

      const monthlyIncome = {};
      incomeData.forEach(transaction => {
        const monthKey = moment(transaction.date).format('YYYY-MM');
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + parseFloat(transaction.amount);
      });

      // Calcular ahorro promedio mensual
      const monthlySavings = [];
      Object.keys(monthlyTotals).forEach(month => {
        const income = monthlyIncome[month] || 0;
        const expenses = monthlyTotals[month] || 0;
        const savings = income - expenses;
        if (savings > 0) monthlySavings.push(savings);
      });

      if (monthlySavings.length === 0) {
        return {
          estimated_months: null,
          estimated_date: null,
          monthly_savings_needed: Math.round(targetAmount / 12),
          message: 'No hay datos suficientes de ahorro para hacer una predicción'
        };
      }

      const averageMonthlySavings = monthlySavings.reduce((sum, val) => sum + val, 0) / monthlySavings.length;
      const remainingAmount = targetAmount - currentAmount;
      
      if (averageMonthlySavings <= 0) {
        return {
          estimated_months: null,
          estimated_date: null,
          monthly_savings_needed: Math.round(remainingAmount / 12),
          message: 'Con el patrón actual de gastos, no podrás alcanzar esta meta'
        };
      }

      const estimatedMonths = Math.ceil(remainingAmount / averageMonthlySavings);
      const estimatedDate = moment().add(estimatedMonths, 'months');

      return {
        estimated_months: estimatedMonths,
        estimated_date: estimatedDate.format('YYYY-MM-DD'),
        monthly_savings_average: Math.round(averageMonthlySavings),
        monthly_savings_needed: Math.round(remainingAmount / estimatedMonths),
        message: `Basado en tu patrón de ahorro, podrías alcanzar esta meta en ${estimatedMonths} meses`
      };
    } catch (error) {
      console.error('Error prediciendo completación de meta:', error);
      throw error;
    }
  }
}

/**
 * Funciones helper para usar desde los controladores
 */

const generatePredictionsForUser = async (userId, options = {}) => {
  const engine = new PredictionEngine(userId);
  const monthsAhead = options.monthsAhead || 3;

  const [monthlyPredictions, categoryPredictions, insights] = await Promise.all([
    engine.generateMonthlyPredictions(monthsAhead),
    engine.generateCategoryPredictions(),
    engine.generateInsights()
  ]);

  return {
    monthly_predictions: monthlyPredictions,
    category_predictions: categoryPredictions,
    insights,
    generated_at: moment().toISOString()
  };
};

const predictGoalCompletion = async (userId, targetAmount, currentAmount = 0) => {
  const engine = new PredictionEngine(userId);
  return await engine.predictGoalCompletion(targetAmount, currentAmount);
};

module.exports = {
  PredictionEngine,
  generatePredictionsForUser,
  predictGoalCompletion
};