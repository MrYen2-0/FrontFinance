// front/src/components/Reports/VisualReports.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { api } from '../../services/api'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import './Reports.css'

function VisualReports() {
  const { transactions = [] } = useApp()
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date()
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange, selectedPeriod])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const response = await api.getReportData({
        startDate: selectedPeriod.start.toISOString().split('T')[0],
        endDate: selectedPeriod.end.toISOString().split('T')[0],
        groupBy: dateRange
      })
      setReportData(response)
    } catch (error) {
      console.error('Error cargando reportes:', error)
      // Usar datos locales si falla la API
      generateLocalReport()
    } finally {
      setIsLoading(false)
    }
  }

  // Generar reporte local con las transacciones disponibles
  const generateLocalReport = () => {
    const timeSeriesData = {}
    const categoryData = {}
    
    transactions.forEach(t => {
      // Agrupar por mes
      const monthKey = new Date(t.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      
      if (!timeSeriesData[monthKey]) {
        timeSeriesData[monthKey] = { period: monthKey, income: 0, expenses: 0 }
      }
      
      if (t.type === 'income') {
        timeSeriesData[monthKey].income += parseFloat(t.amount)
      } else {
        timeSeriesData[monthKey].expenses += parseFloat(t.amount)
      }
      
      // Agrupar por categoría
      if (!categoryData[t.category]) {
        categoryData[t.category] = { category: t.category, total: 0, count: 0 }
      }
      categoryData[t.category].total += parseFloat(t.amount)
      categoryData[t.category].count += 1
    })
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
    setReportData({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        transactionCount: transactions.length
      },
      timeSeriesData: Object.values(timeSeriesData),
      categoryAnalysis: Object.values(categoryData)
        .map(c => ({ ...c, average: c.total / c.count }))
        .sort((a, b) => b.total - a.total),
      topTransactions: [...transactions]
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 10)
    })
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Generando reportes...</p>
      </div>
    )
  }

  const { summary = {}, timeSeriesData = [], categoryAnalysis = [], topTransactions = [] } = reportData || {}

  // Colores para los gráficos
  const COLORS = ['#ff6b35', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4']

  // Función helper para formatear números
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00'
    return `$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-content">
          <FileText size={32} className="header-icon" />
          <div>
            <h1>Reportes Visuales</h1>
            <p>Análisis detallado de tus finanzas</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="period-selector"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="day">Diario</option>
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </select>
          <button className="btn btn-primary">
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon income">
            <TrendingUp />
          </div>
          <div className="summary-content">
            <h3>Ingresos Totales</h3>
            <p className="summary-value">{formatCurrency(summary.totalIncome)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon expense">
            <TrendingDown />
          </div>
          <div className="summary-content">
            <h3>Gastos Totales</h3>
            <p className="summary-value">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon profit">
            <DollarSign />
          </div>
          <div className="summary-content">
            <h3>Balance Neto</h3>
            <p className="summary-value">{formatCurrency(summary.netProfit)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="chart-section">
        <h2>Tendencia de Ingresos vs Gastos</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ff6b35' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                name="Ingresos"
                stroke="#ff6b35" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                name="Gastos"
                stroke="#666" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análisis por categoría */}
      <div className="chart-section">
        <h2>Distribución por Categoría</h2>
        <div className="chart-grid">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryAnalysis.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="total"
                  label={({ category, total }) => `${category}: ${formatCurrency(total)}`}
                >
                  {categoryAnalysis.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="category-list">
            <h3>Top Categorías</h3>
            {categoryAnalysis.slice(0, 5).map((cat, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-count">{cat.count} transacciones</span>
                </div>
                <div className="category-amount">
                  {formatCurrency(cat.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transacciones principales */}
      <div className="transactions-section">
        <h2>Transacciones Principales</h2>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {topTransactions.map((t, index) => (
                <tr key={t.id || index}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td className={`type ${t.type}`}>{t.type}</td>
                  <td className={`amount ${t.type}`}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default VisualReports