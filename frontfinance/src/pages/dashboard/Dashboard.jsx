import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import BalanceChart from '@/components/charts/BalanceChart'
import ExpensesPieChart from '@/components/charts/ExpensesPieChart'
import { financialData } from '@/data/mockData'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function Dashboard() {
  const { balance, monthlyData, categories, recentTransactions } = financialData

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              ${value.toLocaleString()}
            </p>
            {trendValue && (
              <p className={`text-sm flex items-center mt-1 ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {trendValue}% vs mes anterior
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${
            color === 'primary' ? 'bg-primary-100' :
            color === 'green' ? 'bg-green-100' :
            color === 'red' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              color === 'primary' ? 'text-primary-600' :
              color === 'green' ? 'text-green-600' :
              color === 'red' ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de tu situación financiera</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Balance Total"
          value={balance.total}
          icon={DollarSign}
          trend="up"
          trendValue="8.2"
          color="primary"
        />
        <StatCard
          title="Ingresos del Mes"
          value={balance.income}
          icon={TrendingUp}
          trend="up"
          trendValue="5.1"
          color="green"
        />
        <StatCard
          title="Gastos del Mes"
          value={balance.expenses}
          icon={TrendingDown}
          trend="down"
          trendValue="3.2"
          color="red"
        />
        <StatCard
          title="Ahorros del Mes"
          value={balance.savings}
          icon={PiggyBank}
          trend="up"
          trendValue="12.5"
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Financiera</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesPieChart data={categories} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.category} • {transaction.date}</p>
                </div>
                <div className={`font-bold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}