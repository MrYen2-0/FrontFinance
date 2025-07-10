import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, AlertCircle, Target, Calendar } from 'lucide-react'

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m')

  // Mock data para proyecciones
  const projectionData = [
    { month: 'Jul', actual: 3200, predicted: 3180, upper: 3400, lower: 2960 },
    { month: 'Ago', actual: null, predicted: 3350, upper: 3570, lower: 3130 },
    { month: 'Sep', actual: null, predicted: 3280, upper: 3500, lower: 3060 },
    { month: 'Oct', actual: null, predicted: 3420, upper: 3640, lower: 3200 },
    { month: 'Nov', actual: null, predicted: 3650, upper: 3870, lower: 3430 },
    { month: 'Dic', actual: null, predicted: 4200, upper: 4420, lower: 3980 },
  ]

  const spendingPatterns = [
    { category: 'Alimentación', current: 800, predicted: 850, trend: 'up', confidence: 92 },
    { category: 'Transporte', current: 400, predicted: 380, trend: 'down', confidence: 87 },
    { category: 'Entretenimiento', current: 300, predicted: 420, trend: 'up', confidence: 78 },
    { category: 'Servicios', current: 600, predicted: 620, trend: 'up', confidence: 95 },
  ]

  const insights = [
    {
      type: 'warning',
      title: 'Gasto en Entretenimiento Creciente',
      description: 'Se proyecta un aumento del 40% en gastos de entretenimiento para próximos meses.',
      action: 'Revisar suscripciones'
    },
    {
      type: 'success',
      title: 'Ahorro en Transporte',
      description: 'Excelente gestión: reducción proyectada del 5% en gastos de transporte.',
      action: 'Mantener hábitos'
    },
    {
      type: 'info',
      title: 'Época de Gastos Navideños',
      description: 'Diciembre muestra un pico esperado de gastos. Planifica con anticipación.',
      action: 'Crear fondo navideño'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis Predictivo</h1>
          <p className="text-gray-600 mt-1">Proyecciones inteligentes de tus finanzas</p>
        </div>
        <div className="flex space-x-2">
          {['3m', '6m', '12m'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '3m' ? '3 meses' : period === '6m' ? '6 meses' : '1 año'}
            </Button>
          ))}
        </div>
      </div>

      {/* Proyección Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
            Proyección de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip 
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`, 
                  name === 'predicted' ? 'Proyectado' : 
                  name === 'actual' ? 'Real' :
                  name === 'upper' ? 'Límite Superior' : 'Límite Inferior'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="1"
                stroke="none"
                fill="#fed7aa"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="1"
                stroke="none"
                fill="white"
                fillOpacity={1}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#f97316" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#f97316', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Gastos Reales</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Proyección</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-200 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Rango de Confianza</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patrones de Gasto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patrones por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendingPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{pattern.category}</h4>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        pattern.trend === 'up' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {pattern.trend === 'up' ? '↗' : '↘'} {Math.abs(((pattern.predicted - pattern.current) / pattern.current * 100)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Actual: ${pattern.current}</span>
                      <span>Proyectado: ${pattern.predicted}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Confianza</span>
                        <span>{pattern.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${pattern.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className={`p-4 border-l-4 rounded-lg ${
                  insight.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                  insight.type === 'success' ? 'border-green-400 bg-green-50' :
                  'border-blue-400 bg-blue-50'
                }`}>
                  <div className="flex items-start">
                    <div className={`mr-3 mt-0.5 ${
                      insight.type === 'warning' ? 'text-yellow-600' :
                      insight.type === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {insight.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                       insight.type === 'success' ? <Target className="w-5 h-5" /> :
                       <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <Button size="sm" variant="outline" className="text-xs">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}