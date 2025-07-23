// front/src/components/Budget/CategoryBudgetForm.jsx
function CategoryBudgetForm({ category, onSave, monthlyBudget }) {
  const [percentage, setPercentage] = useState('');
  
  const calculatedAmount = monthlyBudget ? 
    (parseFloat(percentage) / 100) * parseFloat(monthlyBudget.total_amount) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budget/category', { 
        category, 
        percentage: parseFloat(percentage) 
      });
      onSave();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
    }
  };

  return (
    <div className="category-budget-form">
      <h4>📊 {category}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>¿Qué porcentaje quieres usar para {category}?</label>
          <div className="percentage-input">
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ej: 50"
              min="0"
              max="100"
              step="0.1"
              required
            />
            <span className="percentage-symbol">%</span>
          </div>
          {percentage && monthlyBudget && (
            <div className="calculated-amount">
              = ${calculatedAmount.toFixed(2)}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </form>
    </div>
  );
}