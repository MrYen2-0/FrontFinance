import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { LogIn, User, Lock } from 'lucide-react'
import './AuthForm.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useApp()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulamos login exitoso
    login({
      id: 1,
      name: 'Usuario Demo',
      email: email
    })
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">💰</span>
            <h1>FinanceAI</h1>
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Accede a tu asistente digital de finanzas</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">
              <User size={18} />
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <Lock size={18} />
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn">
            <LogIn size={18} />
            Iniciar Sesión
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? 
            <Link to="/register" className="auth-link">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login