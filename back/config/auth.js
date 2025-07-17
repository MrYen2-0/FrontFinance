module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'tu-clave-secreta-super-segura',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  bcryptSaltRounds: 10
};