import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Target, Trophy, Star, Zap, Gift, Award, Calendar, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Goals() {
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const goals = [
    {
      id: 1,
      title: 'Vacaciones en Europa',
      description: 'Viaje soñado de 15 días por Europa',
      targetAmount: 5000,
      currentAmount: 3200,
      deadline: '2025-12-15',
      category: 'Viajes',
      priority: 'high',
      status: 'active',
      dailyTarget: 12.33,
      streak: 15,
      level: 3,
      badges: ['Constante', 'Determinado'],
      milestones: [
        { amount: 1250, reached: true, reward: 'Badge de Inicio' },
        { amount: 2500, reached: true, reward: 'Badge de Progreso' },
        { amount: 3750, reached: false, reward: 'Badge de Resistencia' },
        { amount: 5000, reached: false, reward: 'Meta Alcanzada' }
      ]
    },
    {
      id: 2,
      title: 'Fondo de Emergencia',
      description: 'Equivalente a 6 meses de gastos',
      targetAmount: 18000,
      currentAmount: 12500,
      deadline: '2025-10-01',
      category: 'Emergencia',
      priority: 'critical',
      status: 'active',
      dailyTarget: 61.11,
      streak: 45,
      level: 5,
      badges: ['Responsable', 'Precavido', 'Disciplinado'],
      milestones: [
        { amount: 4500, reached: true, reward: 'Badge de Seguridad' },
        { amount: 9000, reached: true, reward: 'Badge de Protección' },
        { amount: 13500, reached: false, reward: 'Badge de Tranquilidad' },
        { amount: 18000, reached: false, reward: 'Meta de Seguridad' }
      ]
    },
    {
      id: 3,
      title: 'Nuevo Laptop',
      description: 'MacBook Pro para trabajo',
      targetAmount: 2500,
      currentAmount: 2500,
      deadline: '2025-07-01',
      category: 'Tecnología',
      priority: 'medium',
      status: 'completed',
      dailyTarget: 0,
      streak: 0,
      level: 'max',
      badges: ['Completo', 'Exitoso'],
      milestones: [
        { amount: 625, reached: true, reward: 'Badge de Inicio' },
        { amount: 1250, reached: true, reward: 'Badge de Progreso' },
        { amount: 1875, reached: true, reward: 'Badge de Persistencia' },
        { amount: 2500, reached: true, reward: '¡Laptop Comprada!' }
      ]
    },
    {
      id: 4,
      title: 'Inversión en Acciones',
      description: 'Portfolio diversificado',
      targetAmount: 10000,
      currentAmount: 1500,
      deadline: '2026-07-01',
      category: 'Inversión',
      priority: 'medium',
      status: 'active',
      dailyTarget: 23.29,
      streak: 8,
      level: 1,
      badges: ['Inversionista Novato'],
      milestones: [
        { amount: 2500, reached: false, reward: 'Badge de Inversión' },
        { amount: 5000, reached: false, reward: 'Badge de Crecimiento' },
        { amount: 7500, reached: false, reward: 'Badge de Diversificación' },
        { amount: 10000, reached: false, reward: 'Portafolio Completo' }
      ]
    }
  ]

  const achievements = [
    { name: 'Primera Meta', description: 'Completaste tu primera meta de ahorro', icon: Trophy, unlocked: true },
    { name: 'Racha de 30 días', description: 'Ahorraste durante 30 días consecutivos', icon: Star, unlocked: true },
    { name: 'Super Ahorrador', description: 'Superaste tu meta diaria 50 veces', icon: Zap, unlocked: false },
    { name: 'Coleccionista', description: 'Obtén todos los badges disponibles', icon: Gift, unlocked: false },
    { name: 'Millonario', description: 'Acumula $1,000,000 en ahorros totales', icon: DollarSign, unlocked: false },
    { name: 'Constancia', description: 'Mantén una racha de 100 días', icon: Calendar, unlocked: false }
  ]

  const userLevel = {
    current: 12,
    xp: 1250,
    nextLevelXp: 1500,
    title: 'Ahorrador Experto'
  }

  const weeklyProgress = [
    { day: 'Lun', saved: 25, target: 35 },
    { day: 'Mar', saved: 40, target: 35 },
    { day: 'Mie', saved: 35, target: 35 },
    { day: 'Jue', saved: 50, target: 35 },
    { day: 'Vie', saved: 30, target: 35 },
    { day: 'Sab', saved: 45, target: 35 },
    { day: 'Dom', saved: 0, target: 35 }
  ]

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getLevelColor = (level) => {
    if (level === 'max') return 'bg-purple-500'
    if (level >= 4) return 'bg-green-500'
    if (level >= 2) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getDaysRemaining = (deadline) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas de Ahorro</h1>
          <p className="text-gray-600 mt-1">Sistema gamificado de objetivos financieros</p>
        </div>
        <Button 
          className="flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Meta
        </Button>
      </div>

      {/* Perfil del Usuario */}
      <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {userLevel.current}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{userLevel.title}</h3>
                <p className="text-gray-600">Nivel {userLevel.current}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${(userLevel.xp / userLevel.nextLevelXp) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{userLevel.xp}/{userLevel.nextLevelXp} XP</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Metas Activas</p>
              <p className="text-2xl font-bold text-primary-600">{goals.filter(g => g.status === 'active').length}</p>
              <p className="text-sm text-gray-500">de {goals.length} totales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progreso Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Esta Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-gray-500 mb-2">{day.day}</p>
                <div className="relative h-24 bg-gray-100 rounded-lg flex items-end justify-center p-1">
                  <div 
                    className={`w-full rounded transition-all ${
                      day.saved >= day.target ? 'bg-green-500' : 
                      day.saved > 0 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                    style={{ height: `${Math.max((day.saved / day.target) * 100, 10)}%` }}
                  ></div>
                  <div className="absolute top-1 text-xs font-medium text-gray-700">
                    ${day.saved}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Meta: ${day.target}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metas Activas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Tus Metas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`${getPriorityColor(goal.priority)} ${goal.status === 'completed' ? 'opacity-75' : ''} hover:shadow-lg transition-shadow cursor-pointer`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{goal.title}</span>
                        {goal.status === 'completed' && <Trophy className="w-5 h-5 text-yellow-500" />}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {goal.status === 'completed' ? 
                          'Completado' : 
                          `Plazo: ${formatDate(goal.deadline)} (${getDaysRemaining(goal.deadline)} días)`
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getLevelColor(goal.level)}`}>
                        Nivel {goal.level}
                      </div>
                      {goal.streak > 0 && (
                        <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          🔥 {goal.streak} días
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progreso */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-medium">
                          ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div 
                          className="bg-primary-500 h-3 rounded-full relative overflow-hidden"
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage(goal.currentAmount, goal.targetAmount)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          {getProgressPercentage(goal.currentAmount, goal.targetAmount) > 30 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20"></div>
                          )}
                        </motion.div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{getProgressPercentage(goal.currentAmount, goal.targetAmount).toFixed(1)}% completado</span>
                        <span>${(goal.targetAmount - goal.currentAmount).toLocaleString()} restante</span>
                      </div>
                    </div>

                    {/* Meta diaria */}
                    {goal.status === 'active' && (
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Meta diaria:</span>
                          <span className="font-bold text-primary-600">${goal.dailyTarget.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Para alcanzar tu meta a tiempo
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Hitos:</p>
                      <div className="grid grid-cols-4 gap-1">
                        {goal.milestones.map((milestone, index) => (
                          <div 
                            key={index}
                            className={`text-center p-1 rounded text-xs ${
                              milestone.reached 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <div className="font-medium">${milestone.amount.toLocaleString()}</div>
                            {milestone.reached && <div>✅</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Badges */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Badges obtenidos:</p>
                      <div className="flex flex-wrap gap-2">
                        {goal.badges.map((badge, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            🏆 {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Próximo hito */}
                    {goal.status === 'active' && (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <p className="text-sm font-medium text-orange-800">Próximo hito:</p>
                        {(() => {
                          const nextMilestone = goal.milestones.find(m => !m.reached)
                          return nextMilestone ? (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-orange-700">${nextMilestone.amount.toLocaleString()}</span>
                              <span className="text-xs text-orange-600">{nextMilestone.reward}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-orange-700">¡Todos los hitos alcanzados!</span>
                          )
                        })()}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex space-x-2 pt-2">
                      {goal.status === 'active' && (
                        <>
                          <Button size="sm" variant="primary" className="flex-1">
                            Agregar Ahorro
                          </Button>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </>
                      )}
                      {goal.status === 'completed' && (
                        <Button size="sm" variant="ghost" className="flex-1">
                          Ver Detalles
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logros y Reconocimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Logros y Reconocimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div 
                key={index} 
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                    : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-full mb-3 ${
                    achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <achievement.icon className={`w-6 h-6 ${
                      achievement.unlocked ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <h4 className={`font-medium mb-1 ${
                    achievement.unlocked ? 'text-green-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Desbloqueado
                      </span>
                    </div>
                  )}
                  {!achievement.unlocked && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        🔒 Bloqueado
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips y Motivación */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Tip del Día</h3>
              <p className="text-gray-700 mb-3">
                "La consistencia es clave: es mejor ahorrar $10 todos los días que $100 una vez al mes. 
                Los pequeños hábitos diarios crean grandes resultados."
              </p>
              <div className="flex space-x-4 text-sm text-gray-600">
                <span>🎯 Establece metas SMART</span>
                <span>📊 Revisa tu progreso semanalmente</span>
                <span>🎉 Celebra los pequeños logros</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}