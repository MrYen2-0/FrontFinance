export const financialData = {
  balance: {
    total: 15420.50,
    income: 4500.00,
    expenses: 3200.00,
    savings: 1300.50
  },
  
  monthlyData: [
    { month: 'Ene', income: 4200, expenses: 3100, savings: 1100 },
    { month: 'Feb', income: 4500, expenses: 3000, savings: 1500 },
    { month: 'Mar', income: 4300, expenses: 3200, savings: 1100 },
    { month: 'Abr', income: 4700, expenses: 3400, savings: 1300 },
    { month: 'May', income: 4500, expenses: 3200, savings: 1300 },
    { month: 'Jun', income: 4800, expenses: 3500, savings: 1300 }
  ],

  categories: [
    { name: 'Alimentación', value: 800, color: '#f97316' },
    { name: 'Transporte', value: 400, color: '#ef4444' },
    { name: 'Entretenimiento', value: 300, color: '#3b82f6' },
    { name: 'Servicios', value: 600, color: '#10b981' },
    { name: 'Salud', value: 200, color: '#8b5cf6' },
    { name: 'Otros', value: 900, color: '#6b7280' }
  ],

  recentTransactions: [
    { id: 1, description: 'Supermercado Central', amount: -85.30, category: 'Alimentación', date: '2025-07-08' },
    { id: 2, description: 'Salario', amount: 4500.00, category: 'Ingreso', date: '2025-07-01' },
    { id: 3, description: 'Netflix', amount: -15.99, category: 'Entretenimiento', date: '2025-07-07' },
    { id: 4, description: 'Gasolina', amount: -60.00, category: 'Transporte', date: '2025-07-06' },
    { id: 5, description: 'Farmacia', amount: -25.50, category: 'Salud', date: '2025-07-05' }
  ]
}