// front/src/components/Budget/DynamicBudget.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../services/api'
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
  Tooltip,
  Legend
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
  const { budgets = [], transactions = [] } = useApp()
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentSuggestions, setAdjustmentSuggestions] = useState([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({
    category: '',
    planned_amount: ''
  })

  useEffect(() => {
    loadAdjustmentSuggestions()
  }, [budgets, transactions])

  const loadAdjustmentSuggestions = async () => {
    try {
      const response = await api.getBudgetSuggestions()
      setAdjustmentSuggestions(response.suggestions || [])
    } catch (error) {
      console.error('Error cargando sugerencias:', error)
    }
  }

  const handleApplyAdjustment = async (suggestion) => {
    try {
      await api.createBudget({
        category: suggestion.category,
        planned_amount: suggestion.suggested
      })
      // Recargar datos
      window.location.reload()
    } catch (error) {
      console.error('Error aplicando ajuste:', error)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await api.createBudget({
        ...newCategory,
        planned_amount: parseFloat(newCategory.planned_amount)
      })
      setShowNewCategory(false)
      setNewCategory({ category: '', planned_amount: '' })
      window.location.reload()
    } catch (error) {
      console.error('Error creando categoría:', error)
    }
  }

  // Calcular totales
  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.planned || 0), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  const totalRemaining = budgets.reduce((sum, b) => sum + (b.remaining || 0), 0)

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.planned) * 100
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 80) return 'warning'
    return 'good'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return '#f44336'
      case 'warning': return '#ff6b35'
      case 'good': return '#4caf50'
      default: return '#666'
    }
  }

  // Datos para el gráfico de distribución
  const pieData = budgets.map(b => ({
    name: b.category,
    value: b.planned
  }))

  // Colores para el gráfico
  const COLORS = ['#ff6b35', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4']

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
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewCategory(true)}
          >
            <Plus size={16} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Resumen de presupuesto */}
      <div className="budget-summary">
        <div className="summary-card">
          <h3>TOTAL PRESUPUESTADO</h3>
          <div className="summary-amount">
            ${totalBudgeted.toFixed(0)}
          </div>
        </div>
        <div className="summary-card">
          <h3>TOTAL GASTADO</h3>
          <div className="summary-amount spent">
            ${totalSpent.toFixed(0)}
          </div>
        </div>
        <div className="summary-card">
          <h3>DISPONIBLE</h3>
          <div className="summary-amount remaining">
            ${totalRemaining.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Ajustes sugeridos */}
      {showAdjustment && adjustmentSuggestions.length > 0 && (
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
                    {((suggestion.suggested - suggestion.current) / suggestion.current * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="adjustment-reason">{suggestion.reason}</p>
                <div className="adjustment-actions">
                  <button className="btn btn-secondary btn-sm">Rechazar</button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApplyAdjustment(suggestion)}
                  >
                    Aplicar
                  </button>
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
            {budgets.length > 0 ? (
              budgets.map((budget) => {
                const status = getBudgetStatus(budget)
                const percentage = Math.min((budget.spent / budget.planned) * 100, 100)
                
                return (
                  <div key={budget.id || budget.category} className="budget-item">
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
                        {status === 'warning' && <AlertCircle size={20} color="#ff6b35" />}
                        {status === 'exceeded' && <AlertCircle size={20} color="#f44336" />}
                      </div>
                    </div>
                    
                    <div className="budget-progress">
                      <div className="progress-track">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${percentage}%`,
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
                        <span>Presupuesto excedido por ${Math.abs(budget.remaining)}</span>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="no-budgets">
                <p>No hay presupuestos configurados</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowNewCategory(true)}
                >
                  Crear primer presupuesto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de distribución */}
        <div className="budget-section">
          <div className="section-header">
            <h2>Distribución del Presupuesto</h2>
          </div>
          <div className="chart-container">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-chart">
                <p>Sin datos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nueva Categoría */}
      {showNewCategory && (
        <div className="modal-overlay" onClick={() => setShowNewCategory(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Categoría de Presupuesto</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <input
                  id="category"
                  type="text"
                  value={newCategory.category}
                  onChange={(e) => setNewCategory({...newCategory, category: e.target.value})}
                  placeholder="Ej: Alimentación"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Monto mensual ($)</label>
                <input
                  id="amount"
                  type="number"
                  value={newCategory.planned_amount}
                  onChange={(e) => setNewCategory({...newCategory, planned_amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowNewCategory(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicBudget