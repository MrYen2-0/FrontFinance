import { useApp } from '../../context/AppContext'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Plus
} from 'lucide-react'

function DashboardHome() {
  const { user } = useApp()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return <div className="loading">Cargando dashboard...</div>
  }

  if (!dashboardData) {
    return <div className="error">Error cargando datos</div>
  }

  // Calcular estadísticas
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses
  
  const completedGoals = goals.filter(g => g.current >= g.target).length
  
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="dashboard-home">
       <div className="dashboard-header">
        <h1>¡Hola, {user?.name}! 👋</h1>
        <p>Aquí tienes un resumen de tus finanzas</p>
      </div>

      {/* Cards de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>${totalIncome.toLocaleString()}</h3>
            <p>Ingresos del mes</p>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <h3>${totalExpenses.toLocaleString()}</h3>
            <p>Gastos del mes</p>
          </div>
        </div>

        <div className="stat-card balance">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>${balance.toLocaleString()}</h3>
            <p>Balance actual</p>
          </div>
        </div>

        <div className="stat-card goals">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <h3>{completedGoals}/{goals.length}</h3>
            <p>Metas completadas</p>
          </div>
        </div>
      </div>

      {/* Sección de contenido principal */}
      <div className="home-content">
        {/* Transacciones recientes */}
        <div className="home-section">
          <div className="section-header">
            <h2>Transacciones Recientes</h2>
            <button className="btn btn-primary btn-sm">
              <Plus size={16} />
              Agregar
            </button>
          </div>
          <div className="transactions-list">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-category">
                    {transaction.category}
                  </div>
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  ${transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progreso de presupuesto */}
        <div className="home-section">
          <div className="section-header">
            <h2>Estado del Presupuesto</h2>
          </div>
          <div className="budget-overview">
            {budgets.slice(0, 3).map(budget => (
              <div key={budget.id} className="budget-item">
                <div className="budget-header">
                  <span className="budget-category">{budget.category}</span>
                  <span className="budget-amount">
                    ${budget.spent} / ${budget.planned}
                  </span>
                </div>
                <div className="budget-progress">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${(budget.spent / budget.planned) * 100}%`,
                      backgroundColor: budget.spent > budget.planned ? '#f44336' : '#ff6600'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome