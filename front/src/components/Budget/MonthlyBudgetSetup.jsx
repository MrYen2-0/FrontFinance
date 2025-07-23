// front/src/components/Budget/MonthlyBudgetSetup.jsx
function MonthlyBudgetSetup({ monthlyBudget, onUpdate }) {
  const [totalAmount, setTotalAmount] = useState(monthlyBudget?.total_amount || '');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budget/monthly', { total_amount: totalAmount });
      onUpdate();
    } catch (error) {
      console.error('Error al establecer presupuesto:', error);
    }
  };

  return (
    <div className="monthly-budget-setup">
      <h3>💰 Presupuesto Total del Mes</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>¿Cuánto dinero tienes para gastar este mes?</label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="Ej: 2000"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Establecer Presupuesto
        </button>
      </form>
    </div>
  );
}