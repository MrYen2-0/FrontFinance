import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import PublicRoute from '@/components/common/PublicRoute'
import Layout from '@/components/layout/Layout'

// Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

// Main Pages
import Dashboard from '@/pages/dashboard/Dashboard'
import Analytics from '@/pages/analytics/Analytics'
import Budgets from '@/pages/budgets/Budgets'
import Reports from '@/pages/reports/Reports'
import Goals from '@/pages/goals/Goals'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="reports" element={<Reports />} />
              <Route path="goals" element={<Goals />} />
            </Route>

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App