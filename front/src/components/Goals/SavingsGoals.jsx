import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { 
  Target, 
  Plus, 
  Trophy, 
  Star, 
  Award, 
  Calendar,
  DollarSign,
  Gift
} from 'lucide-react'
import './Goals.css'

function SavingsGoals() {
  const { goals, addGoal, updateGoalProgress } = useApp()
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    deadline: '',
    category: 'Ahorro'
  })

  const badges = [
    { id: 1, name: 'Primer Ahorro', icon: Star, earned: true, description: 'Completó su primera meta' },
    { id: 2, name: 'Ahorrador Constante', icon: Award, earned: true, description: '30 días consecutivos ahorrando' },
    { id: 3, name: 'Meta Grande', icon: Trophy, earned: true, description: 'Meta de más de $10,000' },
    { id: 4, name: 'Velocista', icon: Star, earned: false, description: 'Meta completada antes del tiempo' },
    { id: 5, name: 'Disciplinado', icon: Award, earned: true, description: 'Sin gastar del ahorro por 60 días' },
    { id: 6, name: 'Campeón', icon: Trophy, earned: false, description: '5 metas completadas' }
  ]

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

  const handleSubmit = (e) => {
    e.preventDefault()
    addGoal({
      ...newGoal,
      target: parseFloat(newGoal.target)
    })
    setNewGoal({ name: '', target: '', deadline: '', category: 'Ahorro' })
    setShowNewGoal(false)
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getDaysLeft = (deadline) => {
    const today = new Date()
    const endDate = new Date(deadline)
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Calcular estadísticas simples
  const totalAhorrado = goals.reduce((sum, goal) => sum + goal.current, 0)
  const metasCompletadas = goals.filter(g => g.current >= g.target).length
  const badgesGanados = badges.filter(b => b.earned).length

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
            <h3>${totalAhorrado.toLocaleString()}</h3>
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
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>{badgesGanados}</h3>
            <p>Badges ganados</p>
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

      {/* Badges */}
      <div className="badges-section">
        <div className="section-header">
          <h2>Colección de Badges</h2>
          <span className="badge-count">{badges.filter(b => b.earned).length}/{badges.length}</span>
        </div>
        <div className="badges-grid">
          {badges.map(badge => (
            <div key={badge.id} className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}>
              <div className="badge-icon">
                <badge.icon size={24} />
              </div>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
              {!badge.earned && <div className="badge-overlay">🔒</div>}
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
          {goals.map(goal => {
            const progress = getProgressPercentage(goal.current, goal.target)
            const daysLeft = getDaysLeft(goal.deadline)
            const isCompleted = goal.current >= goal.target
            
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
                    <span className="current">${goal.current.toLocaleString()}</span>
                    <span className="target">de ${goal.target.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-percentage">{progress.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="goal-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={16} />
                    <span>${(goal.target - goal.current).toLocaleString()} faltante</span>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="goal-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const amount = prompt('¿Cuánto quieres agregar a esta meta?')
                        if (amount && !isNaN(amount)) {
                          updateGoalProgress(goal.id, goal.current + parseFloat(amount))
                        }
                      }}
                    >
                      <Plus size={14} />
                      Agregar Dinero
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <div className="completion-message">
                    <Star size={16} />
                    <span>¡Meta completada! 🎉</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
            <form onSubmit={handleSubmit} className="goal-form">
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
                <label htmlFor="goalTarget">Cantidad objetivo</label>
                <input
                  id="goalTarget"
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  placeholder="5000"
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
                  required
                />
              </div>

              <div className="input-group">
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