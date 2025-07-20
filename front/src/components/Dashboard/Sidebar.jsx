// front/src/components/Dashboard/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { 
  Home, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Target, 
  LogOut,
  User
} from 'lucide-react'
import './Sidebar.css'  // AGREGAR ESTA LÍNEA

function Sidebar() {
  const { user, logout } = useApp()
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: TrendingUp, label: 'Análisis Predictivo', path: '/dashboard/analytics' },
    { icon: PieChart, label: 'Presupuestos', path: '/dashboard/budget' },
    { icon: BarChart3, label: 'Reportes', path: '/dashboard/reports' },
    { icon: Target, label: 'Metas de Ahorro', path: '/dashboard/goals' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">💰</span>
          <h2>FinanceTracker</h2>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <span className="user-name">{user?.name}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive || (item.path === '/dashboard' && location.pathname === '/dashboard') ? 'active' : ''}`
            }
            end={item.path === '/dashboard'}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar