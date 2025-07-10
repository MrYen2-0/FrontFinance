import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  TrendingUp, 
  PieChart, 
  Target, 
  BarChart3,
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Análisis Predictivo', href: '/analytics', icon: TrendingUp },
  { name: 'Presupuestos', href: '/budgets', icon: PieChart },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Metas de Ahorro', href: '/goals', icon: Target },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-primary-500 p-2 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">FinanceAI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <img
            className="h-10 w-10 rounded-full"
            src={user?.avatar}
            alt={user?.name}
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}