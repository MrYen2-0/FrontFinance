const express = require('express');
const { body } = require('express-validator');
const {
  getBudgets,
  upsertBudget,
  upsertBudgetByPercentage,  // AGREGAR
  setMonthlyBudget,          // AGREGAR  
  getMonthlyBudget,          // AGREGAR
  getAdjustmentSuggestions,
  deleteBudget
} = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const budgetValidation = [
  body('category').notEmpty().withMessage('Categoría requerida'),
  body('planned_amount').isFloat({ min: 0.01 }).withMessage('Monto planeado debe ser mayor a 0'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
  body('year').optional().isInt({ min: 2020 }).withMessage('Año inválido')
];

// Aplicar middleware de autenticación
router.use(authMiddleware);

// Rutas
router.get('/', getBudgets);
router.post('/', budgetValidation, upsertBudget);
router.get('/suggestions', getAdjustmentSuggestions);
router.delete('/:id', deleteBudget);
router.post('/monthly', auth, setMonthlyBudget);
router.get('/monthly', auth, getMonthlyBudget);
router.post('/category-percentage', auth, upsertBudgetByPercentage);

module.exports = router;