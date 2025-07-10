import { useState, useEffect } from 'react'
import { financialData } from '@/data/mockData'

export function useFinancialData() {
  const [data, setData] = useState(financialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshData = async () => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setData(financialData)
    } catch (err) {
      setError('Error al cargar los datos financieros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return { data, loading, error, refreshData }
}