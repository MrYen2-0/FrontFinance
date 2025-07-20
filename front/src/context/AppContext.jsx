// front/src/context/AppContext.jsx
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
    case 'SET_DASHBOARD_DATA':
      return { ...state, dashboardData: action.payload }
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
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
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload]
      }
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(budget =>
          budget.id === action.payload.id
            ? { ...budget, ...action.payload }
            : budget
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
      // Cargar datos después de login exitoso
      setTimeout(() => {
        loadUserData()
      }, 100)
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
     // Cargar datos después de registro exitoso
     setTimeout(() => {
       loadUserData()
     }, 100)
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

 // Cargar datos del usuario - con manejo de errores mejorado
 const loadUserData = async () => {
   try {
     // Cargar transacciones
     try {
       const transactionsData = await api.getTransactions({ limit: 50 })
       dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsData.transactions || [] })
     } catch (error) {
       console.log('Error cargando transacciones:', error.message)
       dispatch({ type: 'SET_TRANSACTIONS', payload: [] })
     }

     // Cargar presupuestos
     try {
       const budgetsData = await api.getBudgets()
       dispatch({ type: 'SET_BUDGETS', payload: budgetsData.budgets || [] })
     } catch (error) {
       console.log('Error cargando presupuestos:', error.message)
       dispatch({ type: 'SET_BUDGETS', payload: [] })
     }

     // Cargar metas
     try {
       const goalsData = await api.getGoals()
       dispatch({ type: 'SET_GOALS', payload: goalsData.goals || [] })
     } catch (error) {
       console.log('Error cargando metas:', error.message)
       dispatch({ type: 'SET_GOALS', payload: [] })
     }

     // Cargar datos del dashboard
     try {
       const dashboardData = await api.getDashboardData()
       dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboardData })
     } catch (error) {
       console.log('Error cargando dashboard:', error.message)
     }
   } catch (error) {
     console.error('Error general cargando datos:', error)
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
     
     return newTransaction.transaction
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
     return newGoal.goal
   } catch (error) {
     dispatch({ type: 'SET_ERROR', payload: error.message })
     throw error
   }
 }

 const updateGoalProgress = async (goalId, amount) => {
   try {
     const updatedGoal = await api.updateGoalProgress(goalId, amount)
     dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal.goal })
     return updatedGoal.goal
   } catch (error) {
     dispatch({ type: 'SET_ERROR', payload: error.message })
     throw error
   }
 }

 // Funciones de presupuestos
 const addBudget = async (budgetData) => {
   try {
     const newBudget = await api.createBudget(budgetData)
     dispatch({ type: 'ADD_BUDGET', payload: newBudget.budget })
     return newBudget.budget
   } catch (error) {
     dispatch({ type: 'SET_ERROR', payload: error.message })
     throw error
   }
 }

 const updateBudget = async (budgetId, budgetData) => {
   try {
     const updatedBudget = await api.updateBudget(budgetId, budgetData)
     dispatch({ type: 'UPDATE_BUDGET', payload: updatedBudget.budget })
     return updatedBudget.budget
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
       .catch((error) => {
         console.error('Error al verificar token:', error)
         localStorage.removeItem('token')
       })
   }
 }, [])

 // Recargar datos periódicamente
 useEffect(() => {
   if (state.user) {
     const interval = setInterval(() => {
       loadUserData()
     }, 60000) // Recargar cada minuto

     return () => clearInterval(interval)
   }
 }, [state.user])

 return (
   <AppContext.Provider value={{
     ...state,
     login,
     register,
     logout,
     addTransaction,
     addGoal,
     updateGoalProgress,
     addBudget,
     updateBudget,
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