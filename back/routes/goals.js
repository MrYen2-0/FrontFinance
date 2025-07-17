const express = require('express');
const { body } = require('express-validator');
const {
  getGoals,
  createGoal,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
  getGoalStats
} = require('../controllers/goalController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const goalValidation = [
  body('name').notEmpty().withMessage('Nombre de la meta requerido'),
  body('target_amount').isFloat({ min: 0.01 }).withMessage('Monto objetivo debe ser mayor a 0'),
  body('deadline').isISO8601().withMessage('Fecha límite inválida'),
  body('category').notEmpty().withMessage('Categoría requerida'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Prioridad debe estar entre 1 y 5')
];

const progressValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Monto debe ser mayor o igual a 0')
];

// Aplicar middleware de autenticación
router.use(authMiddleware);

// Rutas
router.get('/', getGoals);
router.post('/', goalValidation, createGoal);
router.put('/:id/progress', progressValidation, updateGoalProgress);
router.put('/:id', goalValidation, updateGoal);
router.delete('/:id', deleteGoal);
router.get('/stats', getGoalStats);

module.exports = router;