import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { Brain, TrendingUp, AlertTriangle, Eye, RefreshCw } from 'lucide-react'
import './Analytics.css'

function PredictiveAnalysis() {
  const [predictions, setPredictions] = useState(null)
  const [insights, setInsights] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonths, setSelectedMonths] = useState(3)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedMonths])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [predictionsData, insightsData] = await Promise.all([
        api.getPredictions({ months: selectedMonths }),
        api.getInsights()
      ])
      
      setPredictions(predictionsData)
      setInsights(insightsData.insights || [])
    } catch (error) {
      console.error('Error cargando análisis:', error)
      setError('Error al cargar los análisis. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const getInsightIcon = (iconName) => {
    const icons = {
      'TrendingUp': TrendingUp,
      'AlertTriangle': AlertTriangle,
      'Brain': Brain,
      'Eye': Eye
    }
    return icons[iconName] || Brain
  }

  const getInsightClass = (type) => {
    const classes = {
      'alert': 'warning',
      'warning': 'warning',
      'positive': 'success',
      'info': 'info',
      'pattern': 'info'
    }
    return classes[type] || 'info'
  }

  if (isLoading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Cargando análisis predictivo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={loadAnalyticsData}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <Brain size={32} className="header-icon" />
          <div>
            <h1>¿Cuánto voy a gastar?</h1>
            <p>Predicciones inteligentes basadas en tus hábitos</p>
          </div>
        </div>
        <div className="period-selector">
          <select 
            value={selectedMonths} 
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
            className="period-select"
          >
            <option value={1}>Próximo mes</option>
            <option value={3}>Próximos 3 meses</option>
            <option value={6}>Próximos 6 meses</option>
          </select>
        </div>
      </div>

      {/* Predicción principal */}
      {predictions?.monthly_predictions && predictions.monthly_predictions.length > 0 && (
        <div className="main-prediction">
          <div className="prediction-card">
            <h2>🔮 Predicción del próximo mes</h2>
            <div className="big-number">
              ${predictions.monthly_predictions[0].predicted_amount.toLocaleString()}
            </div>
            <p>Probablemente vas a gastar esto en {predictions.monthly_predictions[0].month}</p>
            <div className="confidence">
              <span className="confidence-badge">
                {predictions.monthly_predictions[0].confidence}% seguro
              </span>
              <span>Basado en tu historial de gastos</span>
            </div>
          </div>
        </div>
      )}

      {/* Gráfica: ¿Cuánto voy a gastar los próximos meses? */}
      {predictions?.monthly_predictions && (
        <div className="simple-chart-section">
          <div className="chart-header">
            <h2>📅 ¿Cuánto voy a gastar los próximos meses?</h2>
            <p>Esta gráfica te muestra cuánto dinero probablemente vas a gastar</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions.monthly_predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_short" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Predicción']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="predicted_amount" fill="#ff6600" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation">
            <Eye size={16} />
            <span>
              Estas predicciones se basan en tu historial de gastos. 
              La precisión promedio es del {predictions.monthly_predictions[0]?.confidence || 85}%.
            </span>
          </div>
        </div>
      )}

      {/* Predicciones por categoría */}
      {predictions?.category_predictions && predictions.category_predictions.length > 0 && (
        <div className="category-predictions">
          <h2>📊 ¿En qué vas a gastar más o menos?</h2>
          <p>Comparación de lo que gastas ahora vs lo que probablemente vas a gastar</p>
          
          <div className="predictions-grid">
            {predictions.category_predictions.slice(0, 6).map((pred, index) => {
              const diferencia = pred.predicted_next_month - pred.current_average
              const porcentaje = parseFloat(pred.trend_percentage)
              const vaSubir = diferencia > 0
              
              return (
                <div key={index} className="prediction-item">
                  <h3>{pred.category}</h3>
                  <div className="amounts-comparison">
                    <div className="amount-item">
                      <span className="label">Promedio actual:</span>
                      <span className="amount">${pred.current_average.toLocaleString()}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="amount-item">
                      <span className="label">Predicción:</span>
                      <span className="amount">${pred.predicted_next_month.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`change ${vaSubir ? 'up' : 'down'}`}>
                    {vaSubir ? '📈' : '📉'} {vaSubir ? '+' : ''}${Math.abs(diferencia).toLocaleString()} 
                    ({porcentaje > 0 ? '+' : ''}{porcentaje}%)
                  </div>
                  <div className="confidence-indicator">
                    Confianza: {pred.confidence}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Consejos inteligentes */}
      {insights.length > 0 && (
        <div className="simple-advice">
          <h2>💡 Consejos basados en tu comportamiento</h2>
          <div className="advice-list">
            {insights.slice(0, 5).map((insight, index) => {
              const IconComponent = getInsightIcon(insight.icon)
              return (
                <div key={index} className="advice-item">
                  <IconComponent size={20} className={`advice-icon ${getInsightClass(insight.type)}`} />
                  <div>
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {insights.length > 5 && (
            <div className="show-more">
              <p>Y {insights.length - 5} consejos más...</p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {(!predictions?.monthly_predictions || predictions.monthly_predictions.length === 0) && (
        <div className="no-data-message">
          <Brain size={48} />
          <h3>Necesitamos más datos</h3>
          <p>
            Para generar predicciones precisas, necesitamos al menos algunas transacciones. 
            ¡Empieza a registrar tus gastos e ingresos!
          </p>
        </div>
      )}
    </div>
  )
}

export default PredictiveAnalysis