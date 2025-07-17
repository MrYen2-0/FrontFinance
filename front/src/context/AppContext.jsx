import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../services/api'

const AppContext = createContext()

const initialState = {
  user: null,
  transactions: [],
  budgets: [],
  goals: [],
  predictions: [],
  isLoading: false,
  error: null
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_USER':
      return { ...state, user: action.payload, error: null }
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload }
    case 'SET_GOALS':
      return { ...state, goals: action.payload }
    case 'SET_PREDICTIONS':
      return { ...state, predictions: action.payload }
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions]
      }
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload]
      }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal => 
          goal.id === action.payload.id 
            ? { ...goal, ...action.payload }
            : goal
        )
      }
    case 'LOGOUT':
      localStorage.removeItem('token')
      return initialState
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Funciones de autenticación
  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await api.login(credentials)
      localStorage.setItem('token', response.token)
      dispatch({ type: 'SET_USER', payload: response.user })
      await loadUserData() // Cargar datos del usuario
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await api.register(userData)
      localStorage.setItem('token', response.token)
      dispatch({ type: 'SET_USER', payload: response.user })
      await loadUserData()
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      const [transactions, budgets, goals] = await Promise.all([
        api.getTransactions({ limit: 10 }),
        api.getBudgets(),
        api.getGoals()
      ])
      
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions.transactions || [] })
      dispatch({ type: 'SET_BUDGETS', payload: budgets.budgets || [] })
      dispatch({ type: 'SET_GOALS', payload: goals.goals || [] })
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  // Funciones de transacciones
  const addTransaction = async (transactionData) => {
    try {
      const newTransaction = await api.createTransaction(transactionData)
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction.transaction })
      // Recargar presupuestos para actualizar gastos
      const budgets = await api.getBudgets()
      dispatch({ type: 'SET_BUDGETS', payload: budgets.budgets || [] })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  // Funciones de metas
  const addGoal = async (goalData) => {
    try {
      const newGoal = await api.createGoal(goalData)
      dispatch({ type: 'ADD_GOAL', payload: newGoal.goal })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  const updateGoalProgress = async (goalId, amount) => {
    try {
      const updatedGoal = await api.updateGoalProgress(goalId, amount)
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal.goal })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      throw error
    }
  }

  // Verificar token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.getProfile()
        .then(response => {
          dispatch({ type: 'SET_USER', payload: response.user })
          loadUserData()
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
    }
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      addTransaction,
      addGoal,
      updateGoalProgress,
      loadUserData
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider')
  }
  return context
}