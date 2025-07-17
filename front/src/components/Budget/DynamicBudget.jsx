import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts'
import { 
  Settings, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Edit3,
  RefreshCw
} from 'lucide-react'
import './Budget.css'

function DynamicBudget() {
  const { budgets, transactions } = useApp()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showAdjustment, setShowAdjustment] = useState(false)

  // Datos para ajuste automático
  const adjustmentSuggestions = [
    {
      category: 'Alimentación',
      current: 600,
      suggested: 720,
      reason: 'Patrón de gasto aumentó 20% en últimos 2 meses',
      confidence: 85
    },
    {
      category: 'Entretenimiento',
      current: 400,
      suggested: 320,
      reason: 'Gastos menores al presupuesto por 3 meses consecutivos',
      confidence: 92
    },
    {
      category: 'Transporte',
      current: 300,
      suggested: 350,
      reason: 'Aumento en precios de combustible detectado',
      confidence: 78
    }
  ]

  // Datos de comparación mensual
  const monthlyComparison = [
    { month: 'May', planned: 1300, actual: 1250 },
    { month: 'Jun', planned: 1300, actual: 1420 },
    { month: 'Jul', planned: 1300, actual: 1380 }
  ]

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.planned) * 100
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 80) return 'warning'
    return 'good'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return '#f44336'
      case 'warning': return '#ff9800'
      case 'good': return '#4caf50'
      default: return '#ff6600'
    }
  }

  return (
    <div className="budget-container">
      <div className="budget-header">
        <div className="header-content">
          <Settings size={32} className="header-icon" />
          <div>
            <h1>Presupuestos Dinámicos</h1>
            <p>Ajuste inteligente basado en tus patrones de gasto</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAdjustment(!showAdjustment)}
          >
            <RefreshCw size={16} />
            {showAdjustment ? 'Ocultar' : 'Ver'} Ajustes
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Resumen de presupuesto */}
      <div className="budget-summary">
        <div className="summary-card">
          <h3>Total Presupuestado</h3>
          <div className="summary-amount">
            ${budgets.reduce((sum, b) => sum + b.planned, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <h3>Total Gastado</h3>
          <div className="summary-amount spent">
            ${budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <h3>Disponible</h3>
          <div className="summary-amount remaining">
            ${budgets.reduce((sum, b) => sum + b.remaining, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Ajustes automáticos sugeridos */}
      {showAdjustment && (
        <div className="adjustment-section">
          <div className="section-header">
            <h2>Ajustes Sugeridos</h2>
            <span className="confidence-badge">Basado en análisis de patrones</span>
          </div>
          <div className="adjustment-cards">
            {adjustmentSuggestions.map((suggestion, index) => (
              <div key={index} className="adjustment-card">
                <div className="adjustment-header">
                  <h4>{suggestion.category}</h4>
                  <div className="confidence">
                    {suggestion.confidence}% confianza
                  </div>
                </div>
                <div className="adjustment-amounts">
                  <div className="amount-change">
                    <span className="current">${suggestion.current}</span>
                    <span className="arrow">→</span>
                    <span className="suggested">${suggestion.suggested}</span>
                  </div>
                  <div className={`change-percentage ${suggestion.suggested > suggestion.current ? 'increase' : 'decrease'}`}>
                    {suggestion.suggested > suggestion.current ? '+' : ''}
                    {(((suggestion.suggested - suggestion.current) / suggestion.current) * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="adjustment-reason">{suggestion.reason}</p>
                <div className="adjustment-actions">
                  <button className="btn btn-secondary btn-sm">Rechazar</button>
                  <button className="btn btn-primary btn-sm">Aplicar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="budget-grid">
        {/* Lista de presupuestos */}
        <div className="budget-section">
          <div className="section-header">
            <h2>Presupuestos por Categoría</h2>
          </div>
          <div className="budget-list">
            {budgets.map((budget) => {
              const status = getBudgetStatus(budget)
              const percentage = (budget.spent / budget.planned) * 100
              
              return (
                <div key={budget.id} className="budget-item">
                  <div className="budget-item-header">
                    <div className="category-info">
                      <h4>{budget.category}</h4>
                      <div className="budget-amounts">
                        <span className="spent">${budget.spent}</span>
                        <span className="separator">/</span>
                        <span className="planned">${budget.planned}</span>
                      </div>
                    </div>
                    <div className="budget-status">
                      {status === 'good' && <CheckCircle size={20} color="#4caf50" />}
                      {status === 'warning' && <AlertCircle size={20} color="#ff9800" />}
                      {status === 'exceeded' && <AlertCircle size={20} color="#f44336" />}
                      <button className="edit-btn">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="budget-progress">
                    <div className="progress-track">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: getStatusColor(status)
                        }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span className="percentage">{percentage.toFixed(1)}%</span>
                      <span className="remaining">
                        ${budget.remaining > 0 ? budget.remaining : 0} restante
                      </span>
                    </div>
                  </div>

                  {status === 'exceeded' && (
                    <div className="budget-alert">
                      <AlertCircle size={16} />
                      <span>Presupuesto excedido por ${budget.spent - budget.planned}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfica de distribución */}
        <div className="budget-section">
          <div className="section-header">
            <h2>Distribución del Presupuesto</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgets.map(b => ({
                    name: b.category,
                    value: b.planned,
                    spent: b.spent
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}`}
                >
                  {budgets.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getStatusColor(getBudgetStatus(entry))}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Presupuestado']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparación mensual */}
      <div className="budget-section">
        <div className="section-header">
          <h2>Comparación Mensual</h2>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Bar dataKey="planned" fill="#ff6600" name="Presupuestado" />
              <Bar dataKey="actual" fill="#000000" name="Gastado" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consejos de optimización */}
      <div className="budget-section">
        <div className="section-header">
          <h2>Consejos de Optimización</h2>
        </div>
        <div className="optimization-tips">
          <div className="tip-item">
            <TrendingUp size={20} className="tip-icon" />
            <div className="tip-content">
              <h4>Patrón de gasto detectado</h4>
              <p>Gastas 30% más los fines de semana. Considera establecer un presupuesto específico para estos días.</p>
            </div>
          </div>
          <div className="tip-item">
            <AlertCircle size={20} className="tip-icon warning" />
            <div className="tip-content">
              <h4>Categoría en riesgo</h4>
              <p>Tu presupuesto de alimentación se agota rápidamente. La IA sugiere aumentarlo a $720 mensuales.</p>
            </div>
          </div>
          <div className="tip-item">
            <CheckCircle size={20} className="tip-icon success" />
            <div className="tip-content">
              <h4>Oportunidad de ahorro</h4>
              <p>Has ahorrado $80 en entretenimiento este mes. ¡Podrías destinar este extra a tus metas!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicBudget