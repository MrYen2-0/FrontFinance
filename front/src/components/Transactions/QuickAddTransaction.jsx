import { useState } from 'react'
import { api } from '../../services/api'
import { 
  Plus, 
  X, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  Tag,
  FileText,
  Save
} from 'lucide-react'
import moment from 'moment'
import './QuickAddTransaction.css'

function QuickAddTransaction({ onTransactionAdded }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transaction, setTransaction] = useState({
    type: 'expense', // 'expense' o 'income'
    amount: '',
    category: '',
    description: '',
    date: moment().format('YYYY-MM-DD')
  })

  // Categorías predefinidas
  const expenseCategories = [
    'Comida', 'Transporte', 'Entretenimiento', 'Servicios', 
    'Compras', 'Salud', 'Educación', 'Ropa', 'Otros'
  ]

  const incomeCategories = [
    'Salario', 'Freelance', 'Ventas', 'Inversiones', 'Otros'
  ]

  const currentCategories = transaction.type === 'expense' ? expenseCategories : incomeCategories

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const transactionData = {
        ...transaction,
        amount: parseFloat(transaction.amount)
      }

      await api.createTransaction(transactionData)
      
      // Resetear formulario
      setTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: moment().format('YYYY-MM-DD')
      })
      
      setIsOpen(false)
      
      // Notificar al componente padre para recargar datos
      if (onTransactionAdded) {
        onTransactionAdded()
      }

      // Mostrar notificación de éxito
      showNotification('✅ Transacción registrada exitosamente')
      
    } catch (error) {
      console.error('Error creando transacción:', error)
      showNotification('❌ Error al registrar la transacción', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    // Crear notificación temporal
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : '#4caf50'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  if (!isOpen) {
    return (
      <button 
        className="quick-add-fab"
        onClick={() => setIsOpen(true)}
        title="Agregar transacción rápida"
      >
        <Plus size={24} />
      </button>
    )
  }

  return (
    <div className="quick-add-overlay" onClick={() => setIsOpen(false)}>
      <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-add-header">
          <h3>Nueva Transacción</h3>
          <button 
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quick-add-form">
          {/* Tipo de transacción */}
          <div className="transaction-type-selector">
            <button
              type="button"
              className={`type-btn ${transaction.type === 'expense' ? 'active' : ''}`}
              onClick={() => setTransaction({...transaction, type: 'expense', category: ''})}
            >
              <TrendingDown size={20} />
              Gasto
            </button>
            <button
              type="button"
              className={`type-btn ${transaction.type === 'income' ? 'active' : ''}`}
              onClick={() => setTransaction({...transaction, type: 'income', category: ''})}
            >
              <TrendingUp size={20} />
              Ingreso
            </button>
          </div>

          {/* Monto */}
          <div className="input-group">
            <label>
              <DollarSign size={16} />
              Monto
            </label>
            <input
              type="number"
              value={transaction.amount}
              onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              autoFocus
            />
          </div>

          {/* Categoría */}
          <div className="input-group">
            <label>
              <Tag size={16} />
              Categoría
            </label>
            <select
              value={transaction.category}
              onChange={(e) => setTransaction({...transaction, category: e.target.value})}
              required
            >
              <option value="">Selecciona una categoría</option>
              {currentCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="input-group">
            <label>
              <FileText size={16} />
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={transaction.description}
              onChange={(e) => setTransaction({...transaction, description: e.target.value})}
              placeholder="Ej: Almuerzo en restaurante"
            />
          </div>

          {/* Fecha */}
          <div className="input-group">
            <label>
              <Calendar size={16} />
              Fecha
            </label>
            <input
              type="date"
              value={transaction.date}
              onChange={(e) => setTransaction({...transaction, date: e.target.value})}
              required
            />
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuickAddTransaction