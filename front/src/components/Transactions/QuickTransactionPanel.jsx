import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { 
  Plus, 
  Minus,
  Coffee,
  Car,
  ShoppingBag,
  DollarSign,
  Wallet,
  CreditCard,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import moment from 'moment'
import './QuickTransactionPanel.css'

function QuickTransactionPanel({ onTransactionAdded }) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeType, setActiveType] = useState(null) // 'expense' | 'income'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentCategories, setRecentCategories] = useState([])

  // Categorías rápidas predefinidas
  const quickExpenses = [
    { name: 'Comida', icon: Coffee, amount: 25, color: '#ff6b35' },
    { name: 'Transporte', icon: Car, amount: 15, color: '#4ecdc4' },
    { name: 'Compras', icon: ShoppingBag, amount: 50, color: '#45b7d1' },
    { name: 'Servicios', icon: CreditCard, amount: 80, color: '#96ceb4' },
  ]

  const quickIncomes = [
    { name: 'Salario', icon: Wallet, amount: 3500, color: '#4caf50' },
    { name: 'Freelance', icon: DollarSign, amount: 500, color: '#2196f3' },
    { name: 'Ventas', icon: TrendingUp, amount: 200, color: '#ff9800' },
    { name: 'Otros', icon: Plus, amount: 100, color: '#9c27b0' },
  ]

  useEffect(() => {
    loadRecentCategories()
  }, [])

  const loadRecentCategories = async () => {
    try {
      const response = await api.getTransactions({ limit: 20 })
      const transactions = response.transactions || []
      
      // Obtener categorías más usadas
      const categoryCount = {}
      transactions.forEach(t => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1
      })
      
      const recent = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([category]) => category)
      
      setRecentCategories(recent)
    } catch (error) {
      console.error('Error cargando categorías recientes:', error)
    }
  }

  const handleQuickTransaction = async (category, defaultAmount, type) => {
    const amount = prompt(`💰 ¿Cuánto ${type === 'expense' ? 'gastaste' : 'ganaste'} en ${category}?`, defaultAmount)
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return
    }

    const description = prompt(`📝 Descripción (opcional):`, '') || `${type === 'expense' ? 'Gasto' : 'Ingreso'} en ${category}`

    await submitTransaction({
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: moment().format('YYYY-MM-DD')
    })
  }

  const submitTransaction = async (transactionData) => {
    setIsSubmitting(true)
    try {
      await api.createTransaction(transactionData)
      
      // Mostrar notificación de éxito
      showNotification(
        `✅ ${transactionData.type === 'expense' ? 'Gasto' : 'Ingreso'} de $${transactionData.amount} registrado`,
        'success'
      )
      
      // Recargar datos
      if (onTransactionAdded) {
        onTransactionAdded()
      }
      
      // Cerrar panel
      setActiveType(null)
      setIsVisible(false)
      
    } catch (error) {
      console.error('Error creando transacción:', error)
      showNotification('❌ Error al registrar la transacción', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
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
      min-width: 300px;
      animation: slideInRight 0.3s ease;
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 4000)
  }

  return (
    <div className="quick-transaction-panel">
      {/* Botones principales más visibles */}
      {!isVisible && (
        <div className="main-action-buttons">
          <button 
            className="action-button expense-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('expense')
            }}
            title="Registrar gasto rápido"
          >
            <Minus size={20} />
            <span>Gasto</span>
          </button>
          
          <button 
            className="action-button income-button"
            onClick={() => {
              setIsVisible(true)
              setActiveType('income')
            }}
            title="Registrar ingreso rápido"
          >
            <Plus size={20} />
            <span>Ingreso</span>
          </button>
        </div>
      )}

      {/* Panel expandido */}
      {isVisible && (
        <div className="quick-panel-overlay" onClick={() => setIsVisible(false)}>
          <div className="quick-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h3>
                {activeType === 'expense' ? (
                  <>
                    <TrendingDown size={24} />
                    Registrar Gasto Rápido
                  </>
                ) : (
                  <>
                    <TrendingUp size={24} />
                    Registrar Ingreso Rápido
                  </>
                )}
              </h3>
              <button 
                className="close-button"
                onClick={() => setIsVisible(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="quick-categories">
              {activeType === 'expense' && (
                <>
                  <h4>💸 Gastos Comunes</h4>
                  <div className="categories-grid">
                    {quickExpenses.map((category) => (
                      <button
                        key={category.name}
                        className="category-quick-button"
                        style={{ borderColor: category.color }}
                        onClick={() => handleQuickTransaction(category.name, category.amount, 'expense')}
                        disabled={isSubmitting}
                      >
                        <category.icon size={24} style={{ color: category.color }} />
                        <span>{category.name}</span>
                        <small>${category.amount}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeType === 'income' && (
                <>
                  <h4>💰 Ingresos Comunes</h4>
                  <div className="categories-grid">
                    {quickIncomes.map((category) => (
                      <button
                        key={category.name}
                        className="category-quick-button"
                        style={{ borderColor: category.color }}
                        onClick={() => handleQuickTransaction(category.name, category.amount, 'income')}
                        disabled={isSubmitting}
                      >
                        <category.icon size={24} style={{ color: category.color }} />
                        <span>{category.name}</span>
                        <small>${category.amount}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Categorías recientes */}
              {recentCategories.length > 0 && (
                <>
                  <h4>🕒 Categorías Recientes</h4>
                  <div className="recent-categories">
                    {recentCategories.map((category) => (
                      <button
                        key={category}
                        className="recent-category-button"
                        onClick={() => handleQuickTransaction(category, activeType === 'expense' ? 25 : 100, activeType)}
                        disabled={isSubmitting}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Botón personalizado */}
              <div className="custom-transaction">
                <button 
                  className="custom-button"
                  onClick={() => {
                    const category = prompt('📂 ¿Qué categoría?', '')
                    if (category) {
                      handleQuickTransaction(category, activeType === 'expense' ? 25 : 100, activeType)
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <Plus size={20} />
                  Categoría Personalizada
                </button>
              </div>
            </div>

            {isSubmitting && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <span>Guardando transacción...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de actividad cuando no está visible */}
      {!isVisible && (
        <div className="activity-indicator">
          <div className="indicator-text">
            💡 Registra gastos e ingresos rápidamente
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickTransactionPanel