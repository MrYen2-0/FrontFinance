import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { suggestCategory, learnFromTransaction, getLearningHistory } from '../../utils/smartCategorizer'
import { 
  Plus, 
  Minus,
  Brain,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Target
} from 'lucide-react'
import moment from 'moment'
import './SmartTransactionPanel.css'

function SmartTransactionPanel({ onTransactionAdded }) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeType, setActiveType] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    suggestedCategory: '',
    confidence: 0,
    alternatives: [],
    reasoning: ''
  })

  useEffect(() => {
    loadUserHistory()
  }, [])

  const loadUserHistory = async () => {
    try {
      const response = await api.getTransactions({ limit: 50 })
      const transactions = response.transactions || []
      setUserHistory([...transactions, ...getLearningHistory()])
    } catch (error) {
      console.error('Error cargando historial:', error)
      setUserHistory(getLearningHistory())
    }
  }

  const analyzeTransaction = (description, amount) => {
    if (!description.trim()) {
      setTransaction(prev => ({ 
        ...prev, 
        suggestedCategory: '', 
        confidence: 0, 
        alternatives: [],
        reasoning: ''
      }))
      return
    }

    const analysis = suggestCategory(description, amount, userHistory)
    
    setTransaction(prev => ({
      ...prev,
      suggestedCategory: analysis.category,
      confidence: analysis.confidence,
      alternatives: analysis.alternatives || [],
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
      
      // Aprender de esta transacción para futuras sugerencias
      learnFromTransaction(
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
        alternatives: [],
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
    notification.className = `smart-notification ${type}`
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

  return (
    <div className="smart-transaction-panel">
      {/* Botones principales */}
      {!isVisible && (
        <div className="smart-action-buttons">
          <button 
            className="smart-action-button expense-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('expense')
            }}
          >
            <Minus size={20} />
            <span>Registrar Gasto</span>
            <Sparkles size={16} className="ai-indicator" />
          </button>
          
          <button 
            className="smart-action-button income-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('income')
            }}
          >
            <Plus size={20} />
            <span>Registrar Ingreso</span>
            <Sparkles size={16} className="ai-indicator" />
          </button>
        </div>
      )}

      {/* Panel inteligente */}
      {isVisible && (
        <div className="smart-panel-overlay" onClick={() => setIsVisible(false)}>
          <div className="smart-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="smart-panel-header">
              <h3>
                <Brain size={24} />
                {activeType === 'expense' ? 'Gasto Inteligente' : 'Ingreso Inteligente'}
                <span className="ai-badge">AI</span>
              </h3>
              <button className="close-button" onClick={() => setIsVisible(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="smart-form">
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
                    "Ej: Almuerzo en Starbucks, Gasolina Pemex, Netflix..." : 
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

              {/* Sugerencia de IA */}
              {transaction.suggestedCategory && (
                <div className="ai-suggestion">
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
                      <button 
                        className="accept-suggestion"
                        onClick={() => {/* Ya está seleccionada por defecto */}}
                      >
                        <CheckCircle size={16} />
                        Usar esta
                      </button>
                    </div>
                    
                    {transaction.reasoning && (
                      <div className="reasoning">
                        💡 {transaction.reasoning}
                      </div>
                    )}
                  </div>

                  {/* Alternativas */}
                  {transaction.alternatives.length > 0 && (
                    <div className="alternatives">
                      <span>O tal vez:</span>
                      {transaction.alternatives.map(alt => (
                        <button
                          key={alt}
                          className="alternative-btn"
                          onClick={() => setTransaction(prev => ({ 
                            ...prev, 
                            suggestedCategory: alt 
                          }))}
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
                className="smart-submit-btn"
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
                    Registrar en {transaction.suggestedCategory || 'Categoría'}
                  </>
                )}
              </button>
            </div>

            {/* Indicador de IA activa */}
            <div className="ai-status">
              <Brain size={14} />
              <span>IA analizando automáticamente...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartTransactionPanel