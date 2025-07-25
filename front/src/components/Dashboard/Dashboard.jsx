import { Routes, Route } from 'react-router-dom'
import Sidebar from './Sidebar'
import PredictiveAnalysis from '../Analytics/PredictiveAnalysis'
import DynamicBudget from '../Budget/DynamicBudget'
import VisualReports from '../Reports/VisualReports'
import SavingsGoals from '../Goals/SavingsGoals'
import DashboardHome from './DashboardHome'
import BudgetSmartPanel from '../Transactions/BudgetSmartPanel'
import SmartTransactionPanel from '../Transactions/SmartTransactionPanel'
import { useApp } from '../../context/AppContext'
import './Dashboard.css'

function Dashboard() {
  const { loadUserData } = useApp()

  const handleTransactionAdded = async () => {
    // Recargar todos los datos cuando se agrega una transacción
    await loadUserData()
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/analytics" element={<PredictiveAnalysis />} />
          <Route path="/budget" element={<DynamicBudget />} />
          <Route path="/reports" element={<VisualReports />} />
          <Route path="/goals" element={<SavingsGoals />} />
        </Routes>
        
        {/* Panel de transacciones rápidas mejorado */}
      <BudgetSmartPanel onTransactionAdded={handleTransactionAdded} />
      </main>
    </div>
  )
}

export default Dashboard