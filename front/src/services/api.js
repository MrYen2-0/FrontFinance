const API_BASE_URL = 'http://localhost:5000/api';

/// front/src/services/api.js
// Función helper para hacer requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // En api.js, modifica la función para devolver un error más descriptivo:
if (!response.ok) {
  let errorMessage = `API Error: ${response.statusText}`
  try {
    const errorData = await response.json()
    errorMessage = errorData.message || errorMessage
  } catch (e) {
    // Si no se puede parsear el error, usar el mensaje por defecto
  }
  
  if (response.status === 401 && endpoint !== '/auth/profile') {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  
  throw new Error(errorMessage)
}
  
  return response.json();
};

export const api = {
  // Auth endpoints
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  getProfile: () => apiRequest('/auth/profile'),

  // Transactions
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/transactions?${queryString}`);
  },
  
  createTransaction: (transaction) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  
  getTransactionSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/transactions/summary?${queryString}`);
  },

  // Budgets
  getBudgets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/budgets?${queryString}`);
  },
  
  createBudget: (budget) => apiRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify(budget),
  }),
  
  getBudgetSuggestions: () => apiRequest('/budgets/suggestions'),

  // Goals
  getGoals: () => apiRequest('/goals'),
  
  createGoal: (goal) => apiRequest('/goals', {
    method: 'POST',
    body: JSON.stringify(goal),
  }),
  
  updateGoalProgress: (goalId, amount) => apiRequest(`/goals/${goalId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  }),
  
  getGoalStats: () => apiRequest('/goals/stats'),

  // Analytics
  getPredictions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/predictions?${queryString}`);
  },
  
  getInsights: () => apiRequest('/analytics/insights'),
  
  getTrends: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/trends?${queryString}`);
  },

  // Reports
  getDashboardData: () => apiRequest('/reports/dashboard'),
  
  getReportData: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reports/data?${queryString}`);
  },
};