import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Settings, TrendingUp, AlertTriangle, CheckCircle, Plus } from 'lucide-react'

export default function Budgets() {
  const [selectedBudget, setSelectedBudget] = useState('monthly')

  const budgetData = [
    { 
      category: 'Alimentación', 
      budgeted: 1000, 
      spent: 800, 
      percentage: 80, 
      status: 'good',
      trend: 'stable',
      autoAdjust: true
    },
    { 
      category: 'Transporte', 
      budgeted: 500, 
      spent: 620, 
      percentage: 124, 
      status: 'over',
      trend: 'increasing',
      autoAdjust: false
    },
    { 
      category: 'Entretenimiento', 
      budgeted: 300, 
      spent: 420, 
      percentage: 140, 
      status: 'over',
      trend: 'increasing',
      autoAdjust: true
    },
    { 
      category: 'Servicios', 
      budgeted: 700, 
      spent: 650, 
      percentage: 93, 
      status: 'warning',
      trend: 'stable',
      autoAdjust: false
    },
    { 
      category: 'Salud', 
      budgeted: 200, 
      spent: 125, 
      percentage: 63, 
      status: 'good',
      trend: 'decreasing',
      autoAdjust: true
    },
    { 
      category: 'Ahorro', 
      budgeted: 1500, 
      spent: 1300, 
      percentage: 87, 
      status: 'good',
      trend: 'stable',
      autoAdjust: true
    }
  ]

  const monthlyComparison = [
    { month: 'Ene', budgeted: 4200, actual: 4100 },
    { month: 'Feb', budgeted: 4200, actual: 3950 },
    { month: 'Mar', budgeted: 4300, actual: 4250 },
    { month: 'Abr', budgeted: 4400, actual: 4580 },
    { month: 'May', budgeted: 4350, actual: 4200 },
    { month: 'Jun', budgeted: 4200, actual: 4395 }
  ]

  const adjustmentHistory = [
    { date: '2025-07-01', category: 'Entretenimiento', oldAmount: 250, newAmount: 300, reason: 'Patrón de gasto aumentado' },
    { date: '2025-06-15', category: 'Transporte', oldAmount: 450, newAmount: 500, reason: 'Aumento en precio de combustible' },
    { date: '2025-06-01', category: 'Alimentación', oldAmount: 950, newAmount: 1000, reason: 'Inflación en alimentos' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'over': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'over': return <AlertTriangle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos Dinámicos</h1>
          <p className="text-gray-600 mt-1">Gestión inteligente con ajustes automáticos</p>
        </div>
        <Button className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
                <p className="text-2xl font-bold text-gray-900">$4,200</p>
                <p className="text-sm text-green-600 mt-1">3% bajo presupuesto</p>
              </div>
              <div className="p-3 rounded-full bg-primary-100">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastado Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">$3,915</p>
                <p className="text-sm text-blue-600 mt-1">93.2% del presupuesto</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ajustes Automáticos</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-sm text-orange-600 mt-1">Este mes</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalle por Categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto por Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetData.map((item, index) => (
              <div key={index} className="p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span>{item.status === 'good' ? 'Bien' : item.status === 'warning' ? 'Cuidado' : 'Excedido'}</span>
                    </span>
                    {item.autoAdjust && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        Auto-ajuste
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${item.spent} / ${item.budgeted}</p>
                    <p className="text-sm text-gray-500">{item.percentage}%</p>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        item.percentage > 100 ? 'bg-red-500' :
                        item.percentage > 90 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Tendencia: {item.trend === 'increasing' ? '↗ Aumentando' : 
                                item.trend === 'decreasing' ? '↘ Disminuyendo' : '→ Estable'}
                  </span>
                  <Button variant="ghost" size="sm">
                    Ajustar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparación Mensual y Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparación Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Bar dataKey="budgeted" fill="#e5e7eb" name="Presupuestado" />
                <Bar dataKey="actual" fill="#f97316" name="Real" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Ajustes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adjustmentHistory.map((adjustment, index) => (
                <div key={index} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{adjustment.category}</h5>
                    <span className="text-sm text-gray-500">{adjustment.date}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">${adjustment.oldAmount} → ${adjustment.newAmount}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      adjustment.newAmount > adjustment.oldAmount ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {adjustment.newAmount > adjustment.oldAmount ? '+' : '-'}
                      ${Math.abs(adjustment.newAmount - adjustment.oldAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{adjustment.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}