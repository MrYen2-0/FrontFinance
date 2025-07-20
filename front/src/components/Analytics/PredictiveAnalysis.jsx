// front/src/components/Analytics/PredictiveAnalysis.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../services/api'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  Brain,
  Eye
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import './PredictiveAnalysis.css'

function PredictiveAnalysis() {
  const { transactions = [], budgets = [], goals = [] } = useApp()
  const [predictions, setPredictions] = useState(null)
  const [insights, setInsights] = useState([])
  const [trends, setTrends] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod, transactions])

  // En PredictiveAnalysis.jsx, actualiza loadAnalyticsData:
const loadAnalyticsData = async () => {
  setIsLoading(true)
  try {
    const [predictionsResponse, insightsResponse, trendsResponse] = await Promise.allSettled([
      api.getPredictions({ period: selectedPeriod }),
      api.getInsights(),
      api.getTrends({ period: selectedPeriod })
    ])
    
    // Usar los datos que se cargaron exitosamente
    if (predictionsResponse.status === 'fulfilled') {
      setPredictions(predictionsResponse.value.predictions || generateLocalPredictions())
    } else {
      setPredictions(generateLocalPredictions())
    }
    
    if (insightsResponse.status === 'fulfilled') {
      setInsights(insightsResponse.value.insights || [])
    } else {
      setInsights(generateLocalInsights())
    }
    
    if (trendsResponse.status === 'fulfilled') {
      setTrends(trendsResponse.value.trends || [])
    } else {
      setTrends(generateLocalTrends())
    }
  } catch (error) {
    console.error('Error cargando análisis:', error)
    // Usar datos locales si todo falla
    setPredictions(generateLocalPredictions())
    setInsights(generateLocalInsights())
    setTrends(generateLocalTrends())
  } finally {
    setIsLoading(false)
  }
}

  // Generar predicciones locales basadas en datos actuales
  const generateLocalPredictions = () => {
    const currentMonth = new Date().getMonth()
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
    
    // Detectar gastos inusuales
    const categoryAverages = {}
    const unusualExpenses = []
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!categoryAverages[t.category]) {
          categoryAverages[t.category] = []
        }
        categoryAverages[t.category].push(parseFloat(t.amount))
      })
    
    Object.entries(categoryAverages).forEach(([category, amounts]) => {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const recent = amounts[amounts.length - 1]
      if (recent > avg * 1.5) {
        unusualExpenses.push({
          category,
          amount: recent,
          average: avg,
          reason: `${((recent / avg - 1) * 100).toFixed(0)}% más alto que el promedio`
        })
      }
    })
    
    return {
      next_month_expenses: monthlyExpenses * 1.05, // 5% de inflación estimada
      savings_rate: savingsRate,
      budget_health: savingsRate > 20 ? 'healthy' : savingsRate > 10 ? 'warning' : 'critical',
      unusual_expenses: unusualExpenses
    }
  }

  // Generar insights locales
  const generateLocalInsights = () => {
    const insights = []
    
    // Análisis de gastos por categoría
    const categoryTotals = {}
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount)
      })
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (topCategory) {
      insights.push({
        type: 'warning',
        title: 'Categoría con mayor gasto',
        description: `${topCategory[0]} representa el mayor gasto con $${topCategory[1].toFixed(2)}`,
        action: 'Ver detalles'
      })
    }
    
    // Análisis de metas
    const activeGoals = goals.filter(g => g.current < g.target)
    if (activeGoals.length > 0) {
      const avgProgress = activeGoals.reduce((sum, g) => sum + (g.current / g.target), 0) / activeGoals.length
      insights.push({
        type: 'info',
        title: 'Progreso de metas',
        description: `Tienes ${activeGoals.length} metas activas con un progreso promedio del ${(avgProgress * 100).toFixed(0)}%`,
        action: 'Ver metas'
      })
    }
    
    // Análisis de presupuesto
    const overBudget = budgets.filter(b => b.spent > b.planned)
    if (overBudget.length > 0) {
      insights.push({
        type: 'error',
        title: 'Presupuestos excedidos',
        description: `${overBudget.length} categorías han excedido su presupuesto este mes`,
        action: 'Ajustar presupuestos'
      })
    }
    
    return insights
  }

  // Generar tendencias locales
  const generateLocalTrends = () => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const currentMonth = new Date().getMonth()
    const trends = []
    
    // Últimos 6 meses de datos
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthTransactions = transactions.filter(t => {
        const tMonth = new Date(t.date).getMonth()
        return tMonth === monthIndex
      })
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      trends.push({
        period: monthNames[monthIndex],
        income,
        expenses,
        predicted: expenses * 1.05 // Predicción simple
      })
    }
    
    return trends
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Analizando tus datos financieros...</p>
      </div>
    )
  }

  const { 
    next_month_expenses = 0, 
    savings_rate = 0, 
    budget_health = 'stable',
    unusual_expenses = []
  } = predictions || {}

  return (
    <div className="predictive-analysis">
      <div className="analysis-header">
        <div className="header-left">
          <Brain size={32} className="header-icon" />
          <div>
            <h2>Análisis Predictivo</h2>
            <p>Inteligencia artificial aplicada a tus finanzas</p>
          </div>
        </div>
        <div className="period-selector">
          <button 
            className={selectedPeriod === 'week' ? 'active' : ''}
            onClick={() => setSelectedPeriod('week')}
          >
            Semana
          </button>
          <button 
            className={selectedPeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('month')}
          >
            Mes
          </button>
          <button 
            className={selectedPeriod === 'year' ? 'active' : ''}
            onClick={() => setSelectedPeriod('year')}
          >
            Año
          </button>
        </div>
      </div>

      {/* Predicciones principales */}
      <div className="predictions-grid">
        <div className="prediction-card">
          <div className="prediction-icon">
            <TrendingUp />
          </div>
          <div className="prediction-content">
            <h3>Gastos Próximo Mes</h3>
            <p className="prediction-value">${next_month_expenses.toFixed(2)}</p>
            <span className="prediction-detail">
              Basado en tus últimos 3 meses
            </span>
          </div>
        </div>

        <div className="prediction-card">
          <div className="prediction-icon savings">
            <DollarSign />
          </div>
          <div className="prediction-content">
            <h3>Tasa de Ahorro</h3>
            <p className="prediction-value">{savings_rate.toFixed(1)}%</p>
            <span className="prediction-detail">
              De tus ingresos totales
            </span>
          </div>
        </div>

        <div className={`prediction-card ${budget_health}`}>
          <div className="prediction-icon">
            {budget_health === 'healthy' ? <Target /> : <AlertTriangle />}
          </div>
          <div className="prediction-content">
            <h3>Salud Financiera</h3>
            <p className="prediction-value">
              {budget_health === 'healthy' ? 'Excelente' : 
               budget_health === 'warning' ? 'Atención' : 'Crítica'}
            </p>
            <span className="prediction-detail">
              Estado general de tus finanzas
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      {trends.length > 0 && (
        <div className="chart-container">
          <h3>Tendencia de Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ff6b35' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Ingresos"
                stroke="#ff6b35" 
                fillOpacity={1}
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                name="Gastos"
                stroke="#666" 
                fillOpacity={1}
                fill="url(#colorExpense)" 
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                name="Predicción"
                stroke="#ff8c42" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights y recomendaciones */}
      <div className="insights-section">
        <h3>
          <Eye size={20} />
          Insights y Recomendaciones
        </h3>
        <div className="insights-list">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">
                  {insight.type === 'warning' ? <AlertTriangle /> : 
                   insight.type === 'success' ? <TrendingUp /> : 
                   insight.type === 'error' ? <AlertCircle /> :
                   <Eye />}
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                  {insight.action && (
                    <button className="insight-action">
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-insights">
              <p>Agrega más transacciones para obtener insights personalizados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gastos inusuales */}
      {unusual_expenses.length > 0 && (
        <div className="unusual-expenses">
          <h3>
            <AlertTriangle size={20} />
            Gastos Inusuales Detectados
          </h3>
          <div className="unusual-list">
            {unusual_expenses.map((expense, index) => (
              <div key={index} className="unusual-item">
                <div className="unusual-info">
                  <span className="unusual-category">{expense.category}</span>
                  <span className="unusual-amount">${expense.amount.toFixed(2)}</span>
                </div>
                <p className="unusual-reason">{expense.reason}</p>
                <p className="unusual-average">Promedio: ${expense.average.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PredictiveAnalysis