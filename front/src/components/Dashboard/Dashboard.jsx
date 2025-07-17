import { Routes, Route } from 'react-router-dom'
import Sidebar from './Sidebar'
import PredictiveAnalysis from '../Analytics/PredictiveAnalysis'
import DynamicBudget from '../Budget/DynamicBudget'
import VisualReports from '../Reports/VisualReports'
import SavingsGoals from '../Goals/SavingsGoals'
import DashboardHome from './DashboardHome'
import './Dashboard.css'

function Dashboard() {
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
      </main>
    </div>
  )
}

export default Dashboard