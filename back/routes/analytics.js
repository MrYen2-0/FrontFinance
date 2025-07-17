const express = require('express');
const { 
  getPredictions, 
  getInsights, 
  getTrends, 
  getCategoryAnalysis 
} = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);

// Rutas
router.get('/predictions', getPredictions);
router.get('/insights', getInsights);
router.get('/trends', getTrends);
router.get('/category-analysis', getCategoryAnalysis);

module.exports = router;