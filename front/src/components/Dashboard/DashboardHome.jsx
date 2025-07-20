// front/src/components/Dashboard/DashboardHome.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../services/api'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Plus
} from 'lucide-react'
import './DashboardHome.css'

function DashboardHome() {
  const { user, transactions = [], goals = [], budgets = [], addTransaction } = useApp()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState('expense')
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const data = await api.getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    try {
      await addTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        type: transactionType
      })
      setShowTransactionModal(false)
      setNewTransaction({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      // Recargar datos del dashboard
      loadDashboardData()
    } catch (error) {
      console.error('Error al crear transacción:', error)
    }
  }

  const openTransactionModal = (type) => {
    setTransactionType(type)
    setNewTransaction({ ...newTransaction, type })
    setShowTransactionModal(true)
  }

  if (isLoading) {
    return <div className="loading">Cargando dashboard...</div>
  }

  // Calcular estadísticas con validación
  const totalIncome = Array.isArray(transactions) 
    ? transactions
        .filter(t => t && t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    : 0
  
  const totalExpenses = Array.isArray(transactions)
    ? transactions
        .filter(t => t && t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    : 0
  
  const balance = totalIncome - totalExpenses
  
  const completedGoals = Array.isArray(goals) 
    ? goals.filter(g => g && g.current >= g.target).length 
    : 0
  
  const recentTransactions = Array.isArray(transactions) 
    ? transactions.slice(0, 5) 
    : []

  // Categorías según el tipo
  const incomeCategories = ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Otros']
  const expenseCategories = ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Otros']

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <h1>¡Hola, {user?.name || 'Usuario'}!</h1>
        <p>Aquí está tu resumen financiero</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon income">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <p className="stat-label">Ingresos Totales</p>
            <h3 className="stat-value">${totalIncome.toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon expense">
            <TrendingDown />
          </div>
          <div className="stat-content">
            <p className="stat-label">Gastos Totales</p>
            <h3 className="stat-value">${totalExpenses.toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon balance">
            <DollarSign />
          </div>
          <div className="stat-content">
            <p className="stat-label">Balance</p>
            <h3 className="stat-value">${balance.toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon goals">
            <Target />
          </div>
          <div className="stat-content">
            <p className="stat-label">Metas Completadas</p>
            <h3 className="stat-value">{completedGoals} de {goals.length}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-transactions">
          <h3>Transacciones Recientes</h3>
          {recentTransactions.length > 0 ? (
            <div className="transaction-list">
              {recentTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="transaction-item">
                  <div className="transaction-info">
                    <p className="transaction-description">{transaction.description}</p>
                    <p className="transaction-category">{transaction.category}</p>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    ${parseFloat(transaction.amount || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No hay transacciones recientes</p>
          )}
        </div>

        <div className="quick-actions">
          <h3>Acciones Rápidas</h3>
          <button 
            className="action-btn income-btn"
            onClick={() => openTransactionModal('income')}
          >
            <Plus size={16} />
            Nuevo Ingreso
          </button>
          <button 
            className="action-btn expense-btn"
            onClick={() => openTransactionModal('expense')}
          >
            <Plus size={16} />
            Nuevo Gasto
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/dashboard/goals'}
          >
            <Target size={16} />
            Nueva Meta
          </button>
        </div>
      </div>

      {/* Modal de Nueva Transacción */}
      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva {transactionType === 'income' ? 'Ingreso' : 'Gasto'}</h2>
            <form onSubmit={handleTransactionSubmit}>
              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {(transactionType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Monto ($)</label>
                <input
                  id="amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <input
                  id="description"
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="Descripción de la transacción"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Fecha</label>
                <input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTransactionModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar {transactionType === 'income' ? 'Ingreso' : 'Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardHome