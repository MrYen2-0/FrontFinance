const express = require('express');
const { body } = require('express-validator');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones
const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Tipo debe ser income o expense'),
  body('category').notEmpty().withMessage('Categoría requerida'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('description').optional().isLength({ max: 255 }).withMessage('Descripción muy larga'),
  body('date').optional().isISO8601().withMessage('Fecha inválida')
];

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas
router.get('/', getTransactions);
router.post('/', transactionValidation, createTransaction);
router.put('/:id', transactionValidation, updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/summary', getTransactionSummary);

module.exports = router;