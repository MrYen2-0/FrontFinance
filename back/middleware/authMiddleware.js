const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { jwtSecret } = require('../config/auth');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No hay token, acceso denegado' 
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        message: 'Token no válido' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    res.status(401).json({ 
      message: 'Token no válido' 
    });
  }
};

module.exports = authMiddleware;