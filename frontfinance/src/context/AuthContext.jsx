import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular verificación de autenticación
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ 
        id: 1, 
        name: 'Usuario Demo', 
        email: 'usuario@demo.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
      })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        id: 1,
        name: 'Usuario Demo',
        email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
      }
      
      localStorage.setItem('token', 'demo-token')
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Error de autenticación' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        id: 1,
        name,
        email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
      }
      
      localStorage.setItem('token', 'demo-token')
      setUser(userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Error en el registro' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}