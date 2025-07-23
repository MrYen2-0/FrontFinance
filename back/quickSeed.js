// Cargar variables de entorno ANTES de importar los modelos
require('dotenv').config();

const { sequelize, Transaction, User } = require('./models');
const moment = require('moment');

const addTestTransactions = async () => {
  try {
    console.log('🔍 Verificando configuración de BD...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    console.log('Password configurada:', process.env.DB_PASSWORD ? 'Sí' : 'No');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Buscar usuario existente
    const user = await User.findOne({ where: { email: 'tmendezyuen4@gmail.com' } });
    if (!user) {
      console.log('❌ Usuario de prueba no encontrado.');
      console.log('💡 Crea primero un usuario desde la aplicación o ejecuta: npm run seed');
      return;
    }

    console.log(`👤 Usuario encontrado: ${user.name} (${user.email})`);

    // Transacciones de ejemplo para este mes
    const transactions = [
      { type: 'expense', category: 'Comida', amount: 45.50, description: 'Almuerzo restaurante' },
      { type: 'expense', category: 'Comida', amount: 120.00, description: 'Supermercado semanal' },
      { type: 'expense', category: 'Transporte', amount: 25.00, description: 'Gasolina' },
      { type: 'expense', category: 'Entretenimiento', amount: 15.00, description: 'Netflix' },
      { type: 'expense', category: 'Servicios', amount: 80.00, description: 'Internet' },
      { type: 'income', category: 'Salario', amount: 3500.00, description: 'Salario mensual' },
      { type: 'expense', category: 'Comida', amount: 28.75, description: 'Desayuno café' },
      { type: 'expense', category: 'Compras', amount: 67.00, description: 'Ropa casual' }
    ];

    console.log(`📝 Creando ${transactions.length} transacciones...`);

    for (const t of transactions) {
      await Transaction.create({
        user_id: user.id,
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: moment().subtract(Math.floor(Math.random() * 10), 'days').format('YYYY-MM-DD')
      });
    }

    console.log(`✅ ${transactions.length} transacciones de prueba agregadas`);
    console.log('💡 Ahora puedes ver cómo se actualizan los presupuestos');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Access denied')) {
      console.log('\n🔧 Soluciones posibles:');
      console.log('1. Verifica que MySQL esté corriendo');
      console.log('2. Revisa las credenciales en el archivo .env');
      console.log('3. Intenta: mysql -u root -p (con contraseña: yuen)');
    }
  } finally {
    process.exit(0);
  }
};

addTestTransactions();