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
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import moment from 'moment'
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
            ${reportData.summary?.totalGastado?.toLocaleString() || '0'}
          </div>
          <div className="metric-label">Total gastado</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">
            ${reportData.summary?.totalIngresos?.toLocaleString() || '0'}
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
            ${reportData.summary?.promedioSemanal?.toLocaleString() || '0'}
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

      {/* SECCIÓN MEJORADA: DISTRIBUCIÓN Y TOP CATEGORÍAS */}
      {reportData.distribucionGastos && reportData.distribucionGastos.length > 0 && (
        <div className="distribution-overview">
          {/* Gráfica de Pastel Mejorada */}
          <div className="pie-chart-section">
            <div className="chart-header">
              <h2>🍰 Distribución por Categoría</h2>
              <p>Visualiza cómo se distribuye tu dinero entre categorías</p>
            </div>
            <div className="pie-chart-container">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={reportData.distribucionGastos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}\n$${value.toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {reportData.distribucionGastos.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={coloresSimples[index % coloresSimples.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                      contentStyle={{
                        backgroundColor: 'var(--background-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Leyenda personalizada */}
              <div className="chart-legend">
                {reportData.distribucionGastos.map((entry, index) => (
                  <div key={entry.name} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: coloresSimples[index % coloresSimples.length] }}
                    ></div>
                    <span className="legend-text">{entry.name}</span>
                    <span className="legend-amount">${entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Categorías Mejoradas */}
          <div className="top-categories-section">
            <div className="section-header">
              <div>
                <h2>🏆 Top Categorías</h2>
                <p>Tus categorías de mayor gasto este período</p>
              </div>
            </div>
            <div className="categories-list">
              {reportData.gastosDelMes && reportData.gastosDelMes
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 5)
                .map((categoria, index) => (
                  <div key={categoria.categoria} className="category-item">
                    <div className="category-rank">
                      <span className="rank-number">#{index + 1}</span>
                    </div>
                    <div className="category-info">
                      <h4 className="category-name">{categoria.categoria}</h4>
                      <p className="category-details">
                        {categoria.transacciones || 1} transacción{categoria.transacciones !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="category-amount">
                      <span className="amount">${categoria.cantidad.toLocaleString()}</span>
                      <div 
                        className="category-bar"
                        style={{
                          width: `${(categoria.cantidad / reportData.gastosDelMes[0].cantidad) * 100}%`,
                          backgroundColor: coloresSimples[index % coloresSimples.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLA DE TRANSACCIONES PRINCIPALES MEJORADA */}
      {reportData.recentTransactions && reportData.recentTransactions.length > 0 && (
        <div className="transactions-table-section">
          <div className="section-header">
            <div>
              <h2>📋 Transacciones Principales</h2>
              <p>Tus movimientos más importantes del período seleccionado</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-outline btn-sm">
                <Eye size={16} />
                Ver todas
              </button>
            </div>
          </div>
          
          {/* Tabla responsiva */}
          <div className="transactions-table-wrapper">
            <div className="table-container">
              <table className="transactions-table">
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
                  {reportData.recentTransactions.slice(0, 10).map((transaction, index) => (
                    <tr key={transaction.id || index} className="transaction-row">
                      <td className="date-cell">
                        <span className="date-main">
                          {moment(transaction.date).format('DD/MM/YYYY')}
                        </span>
                        <span className="date-time">
                          {moment(transaction.date).format('HH:mm')}
                        </span>
                      </td>
                      <td className="description-cell">
                        <span className="description-text">
                          {transaction.description || 'Sin descripción'}
                        </span>
                      </td>
                      <td className="category-cell">
                        <span className="category-tag">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="type-cell">
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? (
                            <>
                              <TrendingUp size={14} />
                              Ingreso
                            </>
                          ) : (
                            <>
                              <TrendingDown size={14} />
                              Gasto
                            </>
                          )}
                        </span>
                      </td>
                      <td className="amount-cell">
                        <span className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Vista móvil de transacciones */}
            <div className="mobile-transactions">
              {reportData.recentTransactions.slice(0, 8).map((transaction, index) => (
                <div key={transaction.id || index} className="mobile-transaction-card">
                  <div className="transaction-header">
                    <div className="transaction-main-info">
                      <h4 className="transaction-description">
                        {transaction.description || 'Sin descripción'}
                      </h4>
                      <div className="transaction-meta">
                        <span className="transaction-date">
                          {moment(transaction.date).format('DD/MM/YYYY')}
                        </span>
                        <span className="transaction-category">{transaction.category}</span>
                      </div>
                    </div>
                    <div className="transaction-amount-mobile">
                      <span className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        ${Math.abs(transaction.amount).toLocaleString()}
                      </span>
                      <span className={`type-badge-mobile ${transaction.type}`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                ${reportData.summary?.balance?.toLocaleString() || '0'}
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