import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../services/api'
import { 
  Target, 
  Plus, 
  Trophy, 
  Star, 
  Award, 
  Calendar,
  DollarSign,
  Gift,
  Edit3,
  Trash2,
  TrendingUp,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import moment from 'moment'
import './Goals.css'

function SavingsGoals() {
  const { user } = useApp()
  const [goals, setGoals] = useState([])
  const [goalStats, setGoalStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(null)
  const [addAmount, setAddAmount] = useState('')
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    target_amount: '',
    deadline: '',
    category: 'Ahorro',
    priority: 3
  })

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    loadGoalsData()
  }, [])

  const loadGoalsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [goalsResponse, statsResponse] = await Promise.all([
        api.getGoals(),
        api.getGoalStats()
      ])
      
      setGoals(goalsResponse.goals || [])
      setGoalStats(statsResponse)
    } catch (error) {
      console.error('Error cargando metas:', error)
      setError('Error al cargar las metas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      const goalData = {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        priority: parseInt(newGoal.priority)
      }
      
      await api.createGoal(goalData)
      
      // Resetear formulario y cerrar modal
      setNewGoal({
        name: '',
        description: '',
        target_amount: '',
        deadline: '',
        category: 'Ahorro',
        priority: 3
      })
      setShowNewGoal(false)
      
      // Recargar datos
      await loadGoalsData()
    } catch (error) {
      console.error('Error creando meta:', error)
      setError('Error al crear la meta')
    }
  }

  const handleAddFunds = async (goalId) => {
    if (!addAmount || isNaN(addAmount) || parseFloat(addAmount) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    try {
      const goal = goals.find(g => g.id === goalId)
      const newAmount = parseFloat(goal.current_amount) + parseFloat(addAmount)
      
      await api.updateGoalProgress(goalId, newAmount)
      
      // Recargar datos
      await loadGoalsData()
      
      // Resetear y cerrar modal
      setAddAmount('')
      setShowAddFunds(null)
      
      // Mostrar mensaje de éxito
      if (newAmount >= parseFloat(goal.target_amount)) {
        alert('¡Felicidades! Has completado tu meta 🎉')
      }
    } catch (error) {
      console.error('Error actualizando progreso:', error)
      setError('Error al agregar fondos')
    }
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((parseFloat(current) / parseFloat(target)) * 100, 100)
  }

  const getDaysLeft = (deadline) => {
    const days = moment(deadline).diff(moment(), 'days')
    return Math.max(days, 0)
  }

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString()}`
  }

  const badges = [
    { id: 1, name: 'Primer Ahorro', icon: Star, earned: goals.length > 0, description: 'Creó su primera meta' },
    { id: 2, name: 'Ahorrador Constante', icon: Award, earned: (goalStats?.totalSaved || 0) > 1000, description: 'Más de $1,000 ahorrados' },
    { id: 3, name: 'Meta Grande', icon: Trophy, earned: goals.some(g => g.target_amount >= 10000), description: 'Meta de más de $10,000' },
    { id: 4, name: 'Velocista', icon: Star, earned: goals.some(g => g.isCompleted), description: 'Meta completada' },
    { id: 5, name: 'Disciplinado', icon: Award, earned: goals.length >= 3, description: 'Más de 3 metas activas' },
    { id: 6, name: 'Campeón', icon: Trophy, earned: (goalStats?.completedGoals || 0) >= 5, description: '5 metas completadas' }
  ]

  const challenges = [
    {
      id: 1,
      title: 'Desafío Semanal',
      description: 'Ahorra $200 esta semana',
      progress: Math.min((goalStats?.totalSaved || 0) * 0.1, 200),
      target: 200,
      reward: 'Badge especial',
      timeLeft: '3 días',
      difficulty: 'Fácil'
    },
    {
      id: 2,
      title: 'Meta de Consistencia',
      description: 'Mantén 3 metas activas',
      progress: Math.min(goals.length, 3),
      target: 3,
      reward: 'Badge de Disciplina',
      timeLeft: '∞',
      difficulty: 'Medio'
    }
  ]

  if (isLoading) {
    return (
      <div className="goals-container">
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Cargando metas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="goals-container">
        <div className="error-state">
          <h3>Error al cargar metas</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadGoalsData}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="goals-container">
      <div className="goals-header">
        <div className="header-content">
          <Target size={32} className="header-icon" />
          <div>
            <h1>Metas de Ahorro</h1>
            <p>Organiza y alcanza tus objetivos financieros</p>
          </div>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewGoal(true)}
        >
          <Plus size={16} />
          Nueva Meta
        </button>
      </div>

      {/* Estadísticas simples */}
      <div className="simple-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(goalStats?.totalSaved || 0)}</h3>
            <p>Total ahorrado</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-info">
            <h3>{goalStats?.completedGoals || 0}</h3>
            <p>Metas completadas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>{badges.filter(b => b.earned).length}</h3>
            <p>Badges ganados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <h3>{goalStats?.activeGoals || 0}</h3>
            <p>Metas activas</p>
          </div>
        </div>
      </div>

      {/* Desafíos activos */}
      <div className="challenges-section">
        <div className="section-header">
          <h2>Desafíos Activos</h2>
          <span className="challenge-count">{challenges.length} activos</span>
        </div>
        <div className="challenges-grid">
          {challenges.map(challenge => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header">
                <h4>{challenge.title}</h4>
                <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
                  {challenge.difficulty}
                </span>
              </div>
              <p className="challenge-description">{challenge.description}</p>
              
              <div className="challenge-progress">
                <div className="progress-info">
                  <span>Progreso: {challenge.progress}/{challenge.target}</span>
                  <span>{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="challenge-footer">
                <div className="challenge-reward">
                  <Gift size={16} />
                  <span>{challenge.reward}</span>
                </div>
                <div className="time-left">
                  <Calendar size={16} />
                  <span>{challenge.timeLeft}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metas actuales */}
      <div className="goals-section">
        <div className="section-header">
          <h2>Mis Metas</h2>
        </div>
        
        {goals.length === 0 ? (
          <div className="no-goals">
            <Target size={48} />
            <h3>No tienes metas de ahorro</h3>
            <p>Crea tu primera meta para comenzar a ahorrar</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNewGoal(true)}
            >
              <Plus size={16} />
              Crear Primera Meta
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map(goal => {
              const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
              const daysLeft = getDaysLeft(goal.deadline)
              const isCompleted = goal.isCompleted || parseFloat(goal.current_amount) >= parseFloat(goal.target_amount)
              
              return (
                <div key={goal.id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
                  <div className="goal-header">
                    <div className="goal-info">
                      <h3>{goal.name}</h3>
                      <span className="goal-category">{goal.category}</span>
                    </div>
                    <div className="goal-status">
                      {isCompleted ? (
                        <CheckCircle className="status-icon completed" size={20} />
                      ) : (
                        <Clock className="status-icon active" size={20} />
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="goal-description">{goal.description}</p>
                  )}

                  <div className="goal-amount">
                    <div className="amount-display">
                      <span className="current">{formatCurrency(goal.current_amount)}</span>
                      <span className="separator">de</span>
                      <span className="target">{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="progress-percentage">{Math.round(progress)}%</div>
                  </div>

                  <div className="goal-progress">
                    <div 
                      className="progress-bar"
                      style={{ 
                        background: `linear-gradient(to right, var(--primary-color) ${progress}%, var(--background-secondary) ${progress}%)`
                      }}
                    ></div>
                  </div>

                  <div className="goal-footer">
                    <div className="goal-deadline">
                      <Calendar size={16} />
                      <span>
                        {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencida'}
                      </span>
                    </div>
                    
                    {!isCompleted && (
                      <button 
                        className="btn-add-funds"
                        onClick={() => setShowAddFunds(goal.id)}
                      >
                        <Plus size={14} />
                        Agregar Fondos
                      </button>
                    )}

                    {isCompleted && (
                      <div className="completion-message">
                        <Star size={16} />
                        <span>¡Meta completada! 🎉</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal para nueva meta */}
      {showNewGoal && (
        <div className="modal-overlay" onClick={() => setShowNewGoal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Meta de Ahorro</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNewGoal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="goal-form">
              <div className="input-group">
                <label htmlFor="goalName">Nombre de la meta</label>
                <input
                  id="goalName"
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  placeholder="Ej: Vacaciones de verano"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="goalDescription">Descripción (opcional)</label>
                <textarea
                  id="goalDescription"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Describe tu meta..."
                  rows="3"
                />
              </div>

              <div className="input-group">
                <label htmlFor="goalTarget">Cantidad objetivo</label>
                <input
                  id="goalTarget"
                  type="number"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                  placeholder="5000"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="goalDeadline">Fecha límite</label>
                <input
                  id="goalDeadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  min={moment().format('YYYY-MM-DD')}
                  required
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="goalCategory">Categoría</label>
                  <select
                    id="goalCategory"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    required
                  >
                    <option value="Ahorro">Ahorro</option>
                    <option value="Viajes">Viajes</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Educación">Educación</option>
                    <option value="Salud">Salud</option>
                    <option value="Casa">Casa</option>
                    <option value="Emergencia">Emergencia</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="goalPriority">Prioridad</label>
                  <select
                    id="goalPriority"
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                  >
                    <option value="1">Baja</option>
                    <option value="2">Media-Baja</option>
                    <option value="3">Media</option>
                    <option value="4">Media-Alta</option>
                    <option value="5">Alta</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowNewGoal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para agregar fondos */}
      {showAddFunds && (
        <div className="modal-overlay" onClick={() => setShowAddFunds(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Fondos</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddFunds(null)}
              >
                ×
              </button>
            </div>
            <div className="add-funds-content">
              <div className="current-goal-info">
                {(() => {
                  const goal = goals.find(g => g.id === showAddFunds)
                  return goal ? (
                    <div>
                      <h3>{goal.name}</h3>
                      <p>Progreso actual: {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}</p>
                      <p>Faltan: {formatCurrency(parseFloat(goal.target_amount) - parseFloat(goal.current_amount))}</p>
                    </div>
                  ) : null
                })()}
              </div>
              
              <div className="input-group">
                <label htmlFor="addAmount">Cantidad a agregar</label>
                <input
                  id="addAmount"
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="100.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddFunds(null)
                    setAddAmount('')
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleAddFunds(showAddFunds)}
                >
                  <Plus size={16} />
                  Agregar Fondos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavingsGoals