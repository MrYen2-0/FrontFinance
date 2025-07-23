import { useState, useEffect } from 'react'
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
  Tooltip
} from 'recharts'
import { 
  Settings, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Edit3,
  RefreshCw,
  Save,
  X,
  DollarSign,
  Target,
  Calendar
} from 'lucide-react'
import moment from 'moment'
import './Budget.css'

function DynamicBudget() {
  const [budgets, setBudgets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewBudget, setShowNewBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentSuggestions, setAdjustmentSuggestions] = useState([])
  
  const [newBudget, setNewBudget] = useState({
    category: '',
    planned_amount: '',
    month: moment().month() + 1,
    year: moment().year()
  })

  // Categorías disponibles
  const categories = [
    'Comida', 'Transporte', 'Entretenimiento', 'Servicios', 
    'Compras', 'Salud', 'Educación', 'Ropa', 'Otros'
  ]

  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getBudgets()
      setBudgets(response.budgets || [])
      generateAdjustmentSuggestions(response.budgets || [])
    } catch (error) {
      console.error('Error cargando presupuestos:', error)
      setError('Error al cargar los presupuestos')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAdjustmentSuggestions = (budgetsData) => {
    const suggestions = budgetsData
      .filter(budget => {
        const percentage = (budget.spent / budget.planned) * 100
        return percentage > 90 || percentage < 50
      })
      .map(budget => {
        const percentage = (budget.spent / budget.planned) * 100
        let suggested, reason, confidence
        
        if (percentage > 90) {
          suggested = Math.round(budget.planned * 1.2) // Aumentar 20%
          reason = `Presupuesto excedido o cerca del límite (${percentage.toFixed(1)}%)`
          confidence = Math.min(85 + (percentage - 90), 95)
        } else {
          suggested = Math.round(budget.planned * 0.8) // Reducir 20%
          reason = `Presupuesto subutilizado (${percentage.toFixed(1)}%)`
          confidence = Math.min(75 + (50 - percentage), 90)
        }

        return {
          id: budget.id,
          category: budget.category,
          current: budget.planned,
          suggested,
          reason,
          confidence: Math.round(confidence)
        }
      })

    setAdjustmentSuggestions(suggestions)
  }

  const handleCreateBudget = async (e) => {
    e.preventDefault()
    try {
      await api.createBudget(newBudget)
      setNewBudget({
        category: '',
        planned_amount: '',
        month: moment().month() + 1,
        year: moment().year()
      })
      setShowNewBudget(false)
      await loadBudgetData()
    } catch (error) {
      console.error('Error creando presupuesto:', error)
      setError('Error al crear el presupuesto')
    }
  }

  const handleEditBudget = async (budgetId, newAmount) => {
    try {
      const budget = budgets.find(b => b.id === budgetId)
      await api.createBudget({
        category: budget.category,
        planned_amount: parseFloat(newAmount),
        month: moment().month() + 1,
        year: moment().year()
      })
      setEditingBudget(null)
      await loadBudgetData()
    } catch (error) {
      console.error('Error actualizando presupuesto:', error)
      setError('Error al actualizar el presupuesto')
    }
  }

  const applyAdjustment = async (suggestion) => {
    try {
      await api.createBudget({
        category: suggestion.category,
        planned_amount: suggestion.suggested,
        month: moment().month() + 1,
        year: moment().year()
      })
      await loadBudgetData()
    } catch (error) {
      console.error('Error aplicando ajuste:', error)
      setError('Error al aplicar el ajuste')
    }
  }

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

  const totalPlanned = budgets.reduce((sum, b) => sum + b.planned, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = budgets.reduce((sum, b) => sum + Math.max(b.remaining, 0), 0)

  if (isLoading) {
    return (
      <div className="budget-container">
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Cargando presupuestos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="budget-container">
        <div className="error-state">
          <h3>Error al cargar presupuestos</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadBudgetData}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="budget-container">
      <div className="budget-header">
        <div className="header-content">
          <Settings size={32} className="header-icon" />
          <div>
            <h1>Presupuestos Dinámicos</h1>
            <p>Gestiona tus presupuestos con ajustes inteligentes</p>
          </div>
        </div>
        <div className="header-actions">
          {adjustmentSuggestions.length > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAdjustment(!showAdjustment)}
            >
              <RefreshCw size={16} />
              {showAdjustment ? 'Ocultar' : 'Ver'} Ajustes ({adjustmentSuggestions.length})
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewBudget(true)}
          >
            <Plus size={16} />
            Nuevo Presupuesto
          </button>
        </div>
      </div>

      {/* Resumen de presupuesto */}
      <div className="budget-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <Target size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Presupuestado</h3>
            <div className="summary-amount">
              ${totalPlanned.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon expense">
            <DollarSign size={24} />
          </div>
          <div className="summary-info">
            <h3>Total Gastado</h3>
            <div className="summary-amount spent">
              ${totalSpent.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon remaining">
            <TrendingUp size={24} />
          </div>
          <div className="summary-info">
            <h3>Disponible</h3>
            <div className="summary-amount remaining">
              ${totalRemaining.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Calendar size={24} />
          </div>
          <div className="summary-info">
            <h3>Período</h3>
            <div className="summary-amount">
              {moment().format('MMMM YYYY')}
            </div>
          </div>
        </div>
      </div>

      {/* Ajustes automáticos sugeridos */}
      {showAdjustment && adjustmentSuggestions.length > 0 && (
        <div className="adjustment-section">
          <div className="section-header">
            <h2>Ajustes Sugeridos</h2>
            <span className="confidence-badge">Basado en análisis de patrones</span>
          </div>
          <div className="adjustment-cards">
            {adjustmentSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="adjustment-card">
                <div className="adjustment-header">
                  <h4>{suggestion.category}</h4>
                  <div className="confidence">
                    {suggestion.confidence}% confianza
                  </div>
                </div>
                <div className="adjustment-amounts">
                  <div className="amount-change">
                    <span className="current">${suggestion.current.toLocaleString()}</span>
                    <span className="arrow">→</span>
                    <span className="suggested">${suggestion.suggested.toLocaleString()}</span>
                  </div>
                  <div className={`change-percentage ${suggestion.suggested > suggestion.current ? 'increase' : 'decrease'}`}>
                    {suggestion.suggested > suggestion.current ? '+' : ''}
                    {(((suggestion.suggested - suggestion.current) / suggestion.current) * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="adjustment-reason">{suggestion.reason}</p>
                <div className="adjustment-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAdjustmentSuggestions(prev => 
                      prev.filter(s => s.id !== suggestion.id)
                    )}
                  >
                    Rechazar
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => applyAdjustment(suggestion)}
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
          
          {budgets.length === 0 ? (
            <div className="no-budgets">
              <Target size={48} />
              <h3>No tienes presupuestos configurados</h3>
              <p>Crea tu primer presupuesto para comenzar a controlar tus gastos</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewBudget(true)}
              >
                <Plus size={16} />
                Crear Primer Presupuesto
              </button>
            </div>
          ) : (
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
                          {editingBudget === budget.id ? (
                            <div className="edit-amount">
                              <input
                                type="number"
                                defaultValue={budget.planned}
                                className="amount-input"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditBudget(budget.id, e.target.value)
                                  }
                                }}
                                autoFocus
                              />
                              <button 
                                className="save-btn"
                                onClick={(e) => {
                                  const input = e.target.parentElement.querySelector('input')
                                  handleEditBudget(budget.id, input.value)
                                }}
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={() => setEditingBudget(null)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="spent">${budget.spent.toLocaleString()}</span>
                              <span className="separator">/</span>
                              <span className="planned">${budget.planned.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="budget-status">
                        {status === 'good' && <CheckCircle size={20} color="#4caf50" />}
                        {status === 'warning' && <AlertCircle size={20} color="#ff9800" />}
                        {status === 'exceeded' && <AlertCircle size={20} color="#f44336" />}
                        {editingBudget !== budget.id && (
                          <button 
                            className="edit-btn"
                            onClick={() => setEditingBudget(budget.id)}
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
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
                          ${budget.remaining > 0 ? budget.remaining.toLocaleString() : 0} restante
                        </span>
                      </div>
                    </div>

                    {status === 'exceeded' && (
                      <div className="budget-alert">
                        <AlertCircle size={16} />
                        <span>Presupuesto excedido por ${(budget.spent - budget.planned).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Gráfica de distribución */}
        {budgets.length > 0 && (
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
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
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
        )}
      </div>

      {/* Comparación planificado vs real */}
      {budgets.length > 0 && (
        <div className="budget-section full-width">
          <div className="section-header">
            <h2>Planificado vs Real</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Bar dataKey="planned" fill="#ff6600" name="Presupuestado" />
                <Bar dataKey="spent" fill="#333333" name="Gastado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modal para nuevo presupuesto */}
      {showNewBudget && (
        <div className="modal-overlay" onClick={() => setShowNewBudget(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Presupuesto</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewBudget(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBudget} className="budget-form">
              <div className="input-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.filter(cat => 
                    !budgets.some(b => b.category === cat)
                  ).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="planned_amount">Monto mensual</label>
                <input
                  id="planned_amount"
                  type="number"
                  value={newBudget.planned_amount}
                  onChange={(e) => setNewBudget({...newBudget, planned_amount: e.target.value})}
                  placeholder="500.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowNewBudget(false)}
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