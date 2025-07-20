// front/src/components/Goals/SavingsGoals.jsx
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { 
  Target, 
  Plus, 
  Trophy, 
  Calendar,
  DollarSign,
  Gift
} from 'lucide-react'
import './Goals.css'

function SavingsGoals() {
  const { goals = [], addGoal, updateGoalProgress } = useApp()
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    deadline: '',
    category: 'Ahorro'
  })

  const challenges = [
    {
      id: 1,
      title: 'Desafío Semanal',
      description: 'Ahorra $200 esta semana',
      progress: 150,
      target: 200,
      reward: 'Badge especial',
      timeLeft: '3 días',
      difficulty: 'Fácil'
    },
    {
      id: 2,
      title: 'Mes sin Caprichos',
      description: 'No gastes en entretenimiento por 30 días',
      progress: 18,
      target: 30,
      reward: 'Badge de Disciplina',
      timeLeft: '12 días',
      difficulty: 'Difícil'
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addGoal({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target),
        current_amount: 0,
        deadline: newGoal.deadline,
        category: newGoal.category
      })
      setNewGoal({ name: '', target: '', deadline: '', category: 'Ahorro' })
      setShowNewGoal(false)
    } catch (error) {
      console.error('Error al crear meta:', error)
    }
  }

  const getProgressPercentage = (current, target) => {
    const currentVal = parseFloat(current) || 0
    const targetVal = parseFloat(target) || 1
    return Math.min((currentVal / targetVal) * 100, 100)
  }

  const getDaysLeft = (deadline) => {
    if (!deadline) return 0
    const today = new Date()
    const endDate = new Date(deadline)
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Calcular estadísticas simples con validación
  const totalAhorrado = goals.reduce((sum, goal) => {
    const current = parseFloat(goal.current || goal.current_amount) || 0
    return sum + current
  }, 0)
  
  const metasCompletadas = goals.filter(g => {
    const current = parseFloat(g.current || g.current_amount) || 0
    const target = parseFloat(g.target || g.target_amount) || 1
    return current >= target
  }).length

  // Función helper para formatear moneda
  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0
    return numValue.toLocaleString('es-ES', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })
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
            <h3>${formatCurrency(totalAhorrado)}</h3>
            <p>Total ahorrado</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-info">
            <h3>{metasCompletadas}</h3>
            <p>Metas completadas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <h3>{goals.length}</h3>
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
        <div className="goals-grid">
          {goals.length > 0 ? (
            goals.map(goal => {
              const current = parseFloat(goal.current || goal.current_amount) || 0
              const target = parseFloat(goal.target || goal.target_amount) || 1
              const progress = getProgressPercentage(current, target)
              const daysLeft = getDaysLeft(goal.deadline)
              const isCompleted = current >= target
              
              return (
                <div key={goal.id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
                  <div className="goal-header">
                    <div className="goal-info">
                      <h3>{goal.name}</h3>
                      <span className="goal-category">{goal.category}</span>
                    </div>
                    {isCompleted && (
                      <div className="completion-badge">
                        <Trophy size={20} />
                      </div>
                    )}
                  </div>

                  <div className="goal-progress">
                    <div className="progress-amounts">
                      <span className="current">${formatCurrency(current)}</span>
                      <span className="target">de ${formatCurrency(target)}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-percentage">{progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="goal-footer">
                    <div className="deadline">
                      <Calendar size={16} />
                      <span>{daysLeft} días restantes</span>
                    </div>
                    {!isCompleted && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          // Aquí puedes agregar lógica para actualizar el progreso
                          console.log('Agregar fondos a:', goal.name)
                        }}
                      >
                        Agregar Fondos
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="no-goals">
              <p>No hay metas creadas aún</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewGoal(true)}
              >
                Crear primera meta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Meta */}
      {showNewGoal && (
        <div className="modal-overlay" onClick={() => setShowNewGoal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Meta de Ahorro</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="goalName">Nombre de la meta</label>
                <input
                  id="goalName"
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  placeholder="Ej: Viaje a Europa"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goalTarget">Monto objetivo ($)</label>
                <input
                  id="goalTarget"
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goalDeadline">Fecha límite</label>
                <input
                  id="goalDeadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goalCategory">Categoría</label>
                <select
                  id="goalCategory"
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                >
                  <option value="Ahorro">Ahorro General</option>
                  <option value="Viajes">Viajes</option>
                  <option value="Emergencia">Fondo de Emergencia</option>
                  <option value="Compras">Compras Grandes</option>
                  <option value="Educación">Educación</option>
                </select>
              </div>

              <div className="modal-actions">
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
    </div>
  )
}

export default SavingsGoals