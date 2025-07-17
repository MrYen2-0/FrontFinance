import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  BarChart3, 
  Download, 
  Calendar,
  Eye,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import './Reports.css'

function VisualReports() {
  const [reportData, setReportData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [selectedPeriod])

  const loadReportData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getReportData({ period: selectedPeriod })
      setReportData(data)
    } catch (error) {
      console.error('Error cargando reportes:', error)
      setError('Error al cargar los reportes. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      // Aquí podrías implementar la exportación real
      alert('Función de exportación disponible próximamente')
    } catch (error) {
      console.error('Error exportando:', error)
    }
  }

  const coloresSimples = ['#ff6600', '#ff8533', '#ffaa66', '#000000', '#666666', '#999999']

  if (isLoading) {
    return (
      <div className="reports-container">
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reports-container">
        <div className="error-state">
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={loadReportData}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="reports-container">
        <div className="no-data-message">
          <BarChart3 size={48} />
          <h3>No hay datos disponibles</h3>
          <p>Registra algunas transacciones para ver tus reportes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-content">
          <BarChart3 size={32} className="header-icon" />
          <div>
            <h1>Mis Reportes</h1>
            <p>Gráficas simples para entender tus gastos</p>
          </div>
        </div>
        <div className="header-controls">
          <div className="control-group">
            <Calendar size={16} />
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="control-select"
            >
              <option value="month">Este mes</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="year">Este año</option>
            </select>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={exportReport}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Números importantes de un vistazo */}
      <div className="simple-metrics">
        <div className="metric-card">
          <div className="metric-number">
            ${reportData.summary?.totalGastado.toLocaleString() || '0'}
          </div>
          <div className="metric-label">Total gastado</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">
            ${reportData.summary?.totalIngresos.toLocaleString() || '0'}
          </div>
          <div className="metric-label">Total ingresos</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">
            {reportData.summary?.categoriaTop || 'N/A'}
          </div>
          <div className="metric-label">Categoría que más gastas</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">
            ${reportData.summary?.promedioSemanal.toLocaleString() || '0'}
          </div>
          <div className="metric-label">Promedio semanal</div>
        </div>
      </div>

      {/* Gráfica 1: ¿En qué gastas tu dinero? */}
      {reportData.gastosDelMes && reportData.gastosDelMes.length > 0 && (
        <div className="simple-chart-section">
          <div className="chart-header">
            <h2>💰 ¿En qué gastas tu dinero?</h2>
            <p>Esta gráfica te muestra cuánto dinero gastas en cada categoría</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.gastosDelMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Gastaste']}
                  labelFormatter={(label) => `En ${label}`}
                />
                <Bar dataKey="cantidad" fill="#ff6600" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation">
            <Eye size={16} />
            <span>
              La barra más alta es donde gastas más dinero: {reportData.gastosDelMes[0]?.categoria}
            </span>
          </div>
        </div>
      )}

      {/* Gráfica 2: ¿Cómo van tus gastos cada semana? */}
      {reportData.dineroDelMes && reportData.dineroDelMes.length > 0 && (
        <div className="simple-chart-section">
          <div className="chart-header">
            <h2>📅 ¿Cómo van tus gastos cada semana?</h2>
            <p>Compara cuánto gastaste vs cuánto planeabas gastar</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dineroDelMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Bar dataKey="presupuesto" fill="#cccccc" name="Lo que planeé gastar" />
                <Bar dataKey="gaste" fill="#ff6600" name="Lo que realmente gasté" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation">
            <Eye size={16} />
            <span>
              Gris = lo que planeabas gastar. Naranja = lo que realmente gastaste.
              {reportData.dineroDelMes.some(d => d.gaste > d.presupuesto) ? 
                " ¡Cuidado! Algunas semanas te pasaste." : 
                " ¡Bien! Te mantuviste en tu presupuesto."}
            </span>
          </div>
        </div>
      )}

      {/* Gráfica 3: ¿Cómo han cambiado tus gastos? */}
      {reportData.ultimos6Meses && reportData.ultimos6Meses.length > 0 && (
        <div className="simple-chart-section">
          <div className="chart-header">
            <h2>📈 ¿Suben o bajan tus gastos?</h2>
            <p>Ve si gastas más o menos dinero cada mes</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.ultimos6Meses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Gastaste']} />
                <Line 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#ff6600" 
                  strokeWidth={4}
                  dot={{ fill: '#ff6600', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation">
            <Eye size={16} />
            <span>
              {reportData.ultimos6Meses.length >= 2 && 
               reportData.ultimos6Meses[reportData.ultimos6Meses.length - 1].gastos > 
               reportData.ultimos6Meses[0].gastos ? 
                "📈 Tus gastos van subiendo. Tal vez puedes ahorrar más." :
                "📉 Tus gastos van bajando. ¡Excelente trabajo ahorrando!"}
            </span>
          </div>
        </div>
      )}

      {/* Gráfica 4: ¿Qué porcentaje gastas en cada cosa? */}
      {reportData.distribucionGastos && reportData.distribucionGastos.length > 0 && (
        <div className="simple-chart-section">
          <div className="chart-header">
            <h2>🍰 ¿Qué porcentaje gastas en cada cosa?</h2>
            <p>Como un pastel: cada pedazo es una categoría de gasto</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={reportData.distribucionGastos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {reportData.distribucionGastos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={coloresSimples[index % coloresSimples.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Gastaste']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-explanation">
            <Eye size={16} />
            <span>
              El pedazo más grande es donde gastas más de tu dinero total: {reportData.distribucionGastos[0]?.name}
            </span>
          </div>
        </div>
      )}

      {/* Resumen simple */}
      <div className="simple-summary">
        <h2>📝 Resumen Rápido</h2>
        <div className="summary-points">
          <div className="summary-point">
            <span className="point-icon">🥇</span>
            <span>
              Gastas más en: <strong>{reportData.summary?.categoriaTop || 'N/A'}</strong>
              {reportData.gastosDelMes && reportData.gastosDelMes[0] && 
                ` ($${reportData.gastosDelMes[0].cantidad.toLocaleString()})`}
            </span>
          </div>
          <div className="summary-point">
            <span className="point-icon">💡</span>
            <span>
              {reportData.summary?.promedioSemanal > 650 ? 
                `Consejo: Intenta gastar menos de $650 por semana (ahora gastas $${reportData.summary.promedioSemanal})` :
                "¡Bien! Te mantienes cerca de tu presupuesto semanal"}
            </span>
          </div>
          <div className="summary-point">
            <span className="point-icon">🎯</span>
            <span>
              Balance actual: 
              <strong style={{ color: reportData.summary?.balance >= 0 ? '#4caf50' : '#f44336' }}>
                ${reportData.summary?.balance.toLocaleString() || '0'}
              </strong>
              {reportData.summary?.balance >= 0 ? ' ¡Vas bien!' : ' Cuidado con los gastos'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualReports