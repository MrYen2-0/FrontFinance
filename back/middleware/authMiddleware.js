// back/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Log todos los headers
    console.log('Headers recibidos:', req.headers);
    
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No se encontró token');
      return res.status(401).json({ 
        message: 'No hay token, acceso denegado' 
      });
    }

    console.log('Token a verificar:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Está definido' : 'NO está definido');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado exitosamente:', decoded);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    console.log('Usuario encontrado:', user ? user.email : 'No encontrado');
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        message: 'Usuario no encontrado o inactivo' 
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Error completo en authMiddleware:', error);
    res.status(401).json({ 
      message: 'Token no válido',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authMiddleware;