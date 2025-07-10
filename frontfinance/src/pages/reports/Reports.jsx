import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { Download, Filter, Calendar, TrendingUp, Eye } from 'lucide-react'

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m')
  const [selectedReport, setSelectedReport] = useState('overview')

  // Mock data para diferentes reportes
  const overviewData = [
    { month: 'Ene', income: 4200, expenses: 3100, savings: 1100, netWorth: 12000 },
    { month: 'Feb', income: 4500, expenses: 3000, savings: 1500, netWorth: 13500 },
    { month: 'Mar', income: 4300, expenses: 3200, savings: 1100, netWorth: 14600 },
    { month: 'Abr', income: 4700, expenses: 3400, savings: 1300, netWorth: 15900 },
    { month: 'May', income: 4500, expenses: 3200, savings: 1300, netWorth: 17200 },
    { month: 'Jun', income: 4800, expenses: 3500, savings: 1300, netWorth: 18500 }
  ]

  const categoryTrends = [
    { month: 'Ene', alimentacion: 750, transporte: 400, entretenimiento: 250, servicios: 580 },
    { month: 'Feb', alimentacion: 800, transporte: 380, entretenimiento: 280, servicios: 600 },
    { month: 'Mar', alimentacion: 820, transporte: 420, entretenimiento: 320, servicios: 590 },
    { month: 'Abr', alimentacion: 780, transporte: 450, entretenimiento: 380, servicios: 620 },
    { month: 'May', alimentacion: 850, transporte: 430, entretenimiento: 350, servicios: 640 },
    { month: 'Jun', alimentacion: 800, transporte: 400, entretenimiento: 300, servicios: 600 }
  ]

  const savingsBreakdown = [
    { category: 'Cuenta Corriente', amount: 3500, percentage: 23, color: '#f97316' },
    { category: 'Cuenta de Ahorros', amount: 8500, percentage: 55, color: '#10b981' },
    { category: 'Inversiones', amount: 2800, percentage: 18, color: '#3b82f6' },
    { category: 'Efectivo', amount: 620, percentage: 4, color: '#8b5cf6' }
  ]

  const performanceMetrics = [
    { metric: 'Tasa de Ahorro', current: 28.9, target: 30, unit: '%', status: 'good' },
    { metric: 'Gastos vs Ingresos', current: 71.1, target: 70, unit: '%', status: 'warning' },
    { metric: 'Crecimiento Patrimonio', current: 12.5, target: 10, unit: '%', status: 'excellent' },
    { metric: 'Diversificación', current: 75, target: 80, unit: '%', status: 'good' }
  ]

  const reports = [
    { id: 'overview', name: 'Resumen General', icon: TrendingUp },
    { id: 'categories', name: 'Análisis por Categorías', icon: Filter },
    { id: 'savings', name: 'Composición de Ahorros', icon: Eye },
    { id: 'performance', name: 'Métricas de Rendimiento', icon: Calendar }
  ]

  const renderOverviewReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Efectivo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip formatter={(value, name) => [
                `$${value.toLocaleString()}`, 
                name === 'income' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : 'Ahorros'
              ]} />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Line type="monotone" dataKey="savings" stroke="#f97316" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolución del Patrimonio Neto</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Patrimonio Neto']} />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )

  const renderCategoriesReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tendencias por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={categoryTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value, name) => [`$${value}`, name]} />
            <Line type="monotone" dataKey="alimentacion" stroke="#f97316" strokeWidth={2} name="Alimentación" />
            <Line type="monotone" dataKey="transporte" stroke="#ef4444" strokeWidth={2} name="Transporte" />
            <Line type="monotone" dataKey="entretenimiento" stroke="#3b82f6" strokeWidth={2} name="Entretenimiento" />
            <Line type="monotone" dataKey="servicios" stroke="#10b981" strokeWidth={2} name="Servicios" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderSavingsReport = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Ahorros</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={savingsBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="amount"
              >
                {savingsBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Ahorros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savingsBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-center">
                <h4 className="font-medium text-gray-900 mb-2">{metric.metric}</h4>
                <div className="relative">
                  <div className={`text-3xl font-bold mb-1 ${
                    metric.status === 'excellent' ? 'text-green-600' :
                    metric.status === 'good' ? 'text-blue-600' :
                    metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metric.current}{metric.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    Meta: {metric.target}{metric.unit}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.status === 'excellent' ? 'bg-green-500' :
                        metric.status === 'good' ? 'bg-blue-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderReport = () => {
    switch (selectedReport) {
      case 'overview': return renderOverviewReport()
      case 'categories': return renderCategoriesReport()
      case 'savings': return renderSavingsReport()
      case 'performance': return renderPerformanceReport()
      default: return renderOverviewReport()
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes Visuales</h1>
          <p className="text-gray-600 mt-1">Dashboards interactivos y análisis detallados</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Programar
          </Button>
        </div>
      </div>

      {/* Filtros y Navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {reports.map((report) => (
            <Button
              key={report.id}
              variant={selectedReport === report.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedReport(report.id)}
              className="flex items-center"
            >
              <report.icon className="w-4 h-4 mr-2" />
              {report.name}
            </Button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {['1m', '3m', '6m', '1y'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '1m' ? '1 mes' : 
               period === '3m' ? '3 meses' : 
               period === '6m' ? '6 meses' : '1 año'}
            </Button>
          ))}
        </div>
      </div>

      {/* Contenido del Reporte */}
      {renderReport()}
    </div>
  )
}