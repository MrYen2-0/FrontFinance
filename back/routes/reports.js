const express = require('express');
const { getReportData, getDashboardData, getPeriodsComparison } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);

// Rutas
router.get('/dashboard', getDashboardData);
router.get('/data', getReportData);
router.get('/comparison', getPeriodsComparison);

module.exports = router;