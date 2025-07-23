import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { suggestBudgetCategory, learnBudgetTransaction, getBudgetLearningHistory } from '../../utils/smartBudgetCategorizer'
import { 
  Plus, 
  Minus,
  Brain,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react'
import moment from 'moment'
import './BudgetSmartPanel.css'

function BudgetSmartPanel({ onTransactionAdded }) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeType, setActiveType] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userBudgets, setUserBudgets] = useState([])
  const [userHistory, setUserHistory] = useState([])
  
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    suggestedCategory: '',
    confidence: 0,
    budgetImpact: null,
    alternatives: [],
    availableCategories: [],
    reasoning: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const [budgetsResponse, transactionsResponse] = await Promise.all([
        api.getBudgets(),
        api.getTransactions({ limit: 30 })
      ])
      
      setUserBudgets(budgetsResponse.budgets || [])
      setUserHistory([
        ...(transactionsResponse.transactions || []),
        ...getBudgetLearningHistory()
      ])
    } catch (error) {
      console.error('Error cargando datos:', error)
      setUserHistory(getBudgetLearningHistory())
    }
  }

  const analyzeTransaction = (description, amount) => {
    if (!description.trim()) {
      setTransaction(prev => ({ 
        ...prev, 
        suggestedCategory: '', 
        confidence: 0, 
        budgetImpact: null,
        alternatives: [],
        reasoning: ''
      }))
      return
    }

    const analysis = suggestBudgetCategory(description, amount, userBudgets, userHistory)
    
    setTransaction(prev => ({
      ...prev,
      suggestedCategory: analysis.category || '',
      confidence: analysis.confidence,
      budgetImpact: analysis.budgetImpact,
      alternatives: analysis.alternatives || [],
      availableCategories: analysis.availableCategories || [],
      reasoning: analysis.reasoning || ''
    }))
  }

  const handleDescriptionChange = (value) => {
    setTransaction(prev => ({ ...prev, description: value }))
    analyzeTransaction(value, transaction.amount)
  }

  const handleAmountChange = (value) => {
    setTransaction(prev => ({ ...prev, amount: value }))
    analyzeTransaction(transaction.description, value)
  }

  const selectCategory = (category) => {
    setTransaction(prev => ({ ...prev, suggestedCategory: category }))
    
    // Recalcular impacto para la nueva categoría
    if (transaction.amount) {
      const budget = userBudgets.find(b => b.category === category)
      if (budget) {
        const numAmount = parseFloat(transaction.amount)
        const newSpent = budget.spent + numAmount
        const newPercentage = (newSpent / budget.planned) * 100
        
        setTransaction(prev => ({
          ...prev,
          budgetImpact: {
            currentSpent: budget.spent,
            newSpent: newSpent,
            planned: budget.planned,
            remaining: Math.max(budget.planned - newSpent, 0),
            newPercentage: Math.round(newPercentage),
            willExceed: newSpent > budget.planned,
            severity: newPercentage > 100 ? 'danger' : newPercentage > 80 ? 'warning' : 'good'
          }
        }))
      }
    }
  }

  const submitTransaction = async () => {
    if (!transaction.description.trim() || !transaction.amount || !transaction.suggestedCategory) {
      showNotification('❌ Por favor completa todos los campos', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const transactionData = {
        type: activeType,
        category: transaction.suggestedCategory,
        amount: parseFloat(transaction.amount),
        description: transaction.description.trim(),
        date: moment().format('YYYY-MM-DD')
      }

      await api.createTransaction(transactionData)
      
      // Aprender de esta transacción
      learnBudgetTransaction(
        transaction.description, 
        transaction.suggestedCategory, 
        transaction.amount
      )
      
      showNotification(
        `✅ ${activeType === 'expense' ? 'Gasto' : 'Ingreso'} registrado en ${transaction.suggestedCategory}`,
        'success'
      )
      
      // Resetear formulario
      setTransaction({
        description: '',
        amount: '',
        suggestedCategory: '',
        confidence: 0,
        budgetImpact: null,
        alternatives: [],
        availableCategories: [],
        reasoning: ''
      })
      
      if (onTransactionAdded) {
        onTransactionAdded()
      }
      
      setIsVisible(false)
      setActiveType(null)
      
    } catch (error) {
      console.error('Error creando transacción:', error)
      showNotification('❌ Error al registrar la transacción', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div')
    notification.className = `budget-notification ${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : '#4caf50'};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 600;
      min-width: 320px;
      animation: slideInRight 0.3s ease;
    `
    
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 4000)
  }

  // Si no hay presupuestos configurados
  if (userBudgets.length === 0 && !isVisible) {
    return (
      <div className="budget-smart-panel">
        <div className="no-budgets-cta">
          <div className="cta-content">
            <Target size={24} />
            <span>Configura presupuestos para usar gastos inteligentes</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="budget-smart-panel">
      {/* Botones principales */}
      {!isVisible && (
        <div className="budget-action-buttons">
          <button 
            className="budget-action-button expense-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('expense')
            }}
          >
            <Minus size={20} />
            <span>Gasto Inteligente</span>
            <Brain size={16} className="ai-icon" />
          </button>
          
          <button 
            className="budget-action-button income-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('income')
            }}
          >
            <Plus size={20} />
            <span>Ingreso</span>
          </button>
        </div>
      )}

      {/* Panel expandido */}
      {isVisible && (
        <div className="budget-panel-overlay" onClick={() => setIsVisible(false)}>
          <div className="budget-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="budget-panel-header">
              <h3>
                <Brain size={24} />
                {activeType === 'expense' ? 'Gasto Conectado a Presupuesto' : 'Registrar Ingreso'}
                <span className="smart-badge">SMART</span>
              </h3>
              <button className="close-button" onClick={() => setIsVisible(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="budget-form">
              {/* Descripción */}
              <div className="input-group">
                <label>
                  🔍 ¿Qué {activeType === 'expense' ? 'compraste' : 'ganaste'}?
                </label>
                <input
                  type="text"
                  value={transaction.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder={activeType === 'expense' ? 
                    "Ej: Almuerzo McDonald's, Gasolina Pemex..." : 
                    "Ej: Salario mensual, Proyecto freelance..."
                  }
                  autoFocus
                />
              </div>

              {/* Monto */}
              <div className="input-group">
                <label>💰 ¿Cuánto?</label>
                <input
                  type="number"
                  value={transaction.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
              </div>

              {/* Categorías disponibles */}
              {activeType === 'expense' && transaction.availableCategories.length > 0 && (
                <div className="available-budgets">
                  <h4>📊 Tus Presupuestos Configurados:</h4>
                  <div className="budgets-grid">
                    {userBudgets.map(budget => (
                      <button
                        key={budget.category}
                        className={`budget-category-btn ${transaction.suggestedCategory === budget.category ? 'selected' : ''}`}
                        onClick={() => selectCategory(budget.category)}
                      >
                        <div className="budget-info">
                          <span className="category-name">{budget.category}</span>
                          <div className="budget-status">
                            <span className="spent">${budget.spent}</span>
                            <span className="total">/ ${budget.planned}</span>
                          </div>
                          <div className="budget-bar">
                            <div 
                              className="budget-fill"
                              style={{ 
                                width: `${Math.min((budget.spent / budget.planned) * 100, 100)}%`,
                                backgroundColor: (budget.spent / budget.planned) > 0.8 ? '#f44336' : '#4caf50'
                              }}
                            ></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencia inteligente */}
              {transaction.suggestedCategory && activeType === 'expense' && (
                <div className="smart-suggestion">
                  <div className="suggestion-header">
                    <Zap size={16} />
                    <span>Sugerencia Inteligente</span>
                    <div className="confidence-badge">
                      {transaction.confidence}% seguro
                    </div>
                  </div>
                  
                  <div className="suggested-category">
                    <div className="category-main">
                      <Target size={18} />
                      <span>{transaction.suggestedCategory}</span>
                    </div>
                    
                    {transaction.reasoning && (
                      <div className="reasoning">
                        💡 {transaction.reasoning}
                      </div>
                    )}

                    {/* Impacto en presupuesto */}
                    {transaction.budgetImpact && (
                      <div className={`budget-impact ${transaction.budgetImpact.severity}`}>
                        <div className="impact-header">
                          <BarChart3 size={16} />
                          <span>Impacto en Presupuesto</span>
                        </div>
                        <div className="impact-details">
                          <div className="impact-row">
                            <span>Gastado actual:</span>
                            <span>${transaction.budgetImpact.currentSpent}</span>
                          </div>
                          <div className="impact-row">
                            <span>Después de este gasto:</span>
                            <span>${transaction.budgetImpact.newSpent}</span>
                          </div>
                          <div className="impact-row">
                            <span>Presupuesto total:</span>
                            <span>${transaction.budgetImpact.planned}</span>
                          </div>
                          <div className="impact-row">
                            <span>Progreso:</span>
                            <span className={transaction.budgetImpact.severity}>
                              {transaction.budgetImpact.newPercentage}%
                              {transaction.budgetImpact.willExceed && (
                                <AlertTriangle size={14} className="warning-icon" />
                              )}
                            </span>
                          </div>
                          {transaction.budgetImpact.willExceed && (
                            <div className="exceeds-warning">
                              ⚠️ Este gasto excederá tu presupuesto por ${(transaction.budgetImpact.newSpent - transaction.budgetImpact.planned).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Alternativas */}
                  {transaction.alternatives.length > 0 && (
                    <div className="alternatives">
                      <span>¿O tal vez?</span>
                      {transaction.alternatives.map(alt => (
                        <button
                          key={alt}
                          className="alternative-btn"
                          onClick={() => selectCategory(alt)}
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botón de envío */}
              <button 
                className={`budget-submit-btn ${transaction.budgetImpact?.severity || ''}`}
                onClick={submitTransaction}
                disabled={!transaction.description || !transaction.amount || !transaction.suggestedCategory || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {transaction.budgetImpact?.willExceed ? 
                      `⚠️ Registrar (Excede Presupuesto)` : 
                      `Registrar en ${transaction.suggestedCategory || 'Categoría'}`
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetSmartPanel