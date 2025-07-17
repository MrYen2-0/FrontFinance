const { sequelize, User, Transaction, Budget, Goal, Challenge } = require('../models');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const seedData = async () => {
  try {
    // Forzar recreación de tablas (solo para desarrollo)
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos sincronizada');

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await User.create({
      name: 'Usuario Demo',
      email: 'demo@finanzas.com',
      password: hashedPassword
    });

    console.log('✅ Usuario de prueba creado');

    // Crear transacciones de los últimos 6 meses
    const transactions = [];
    
    // Generar datos históricos para 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = moment().subtract(i, 'months');
      const monthStart = monthDate.startOf('month').clone();
      const monthEnd = monthDate.endOf('month').clone();
      
      // Ingreso mensual
      transactions.push({
        user_id: user.id,
        type: 'income',
        category: 'Salario',
        amount: 3000 + (Math.random() * 400 - 200), // 2800-3200
        description: 'Pago mensual',
        date: monthStart.add(1, 'day').format('YYYY-MM-DD')
      });

      // Gastos del mes
      const categories = [
        { name: 'Alimentación', base: 600, variance: 150 },
        { name: 'Transporte', base: 300, variance: 100 },
        { name: 'Servicios', base: 450, variance: 50 },
        { name: 'Entretenimiento', base: 250, variance: 200 },
        { name: 'Compras', base: 200, variance: 300 }
      ];

      categories.forEach(category => {
        const numTransactions = Math.floor(Math.random() * 8) + 3; // 3-10 transacciones por categoría
        const totalAmount = category.base + (Math.random() * category.variance * 2 - category.variance);
        
        for (let j = 0; j < numTransactions; j++) {
          const transactionAmount = (totalAmount / numTransactions) * (0.5 + Math.random());
          const randomDay = Math.floor(Math.random() * 28) + 1;
          
          transactions.push({
            user_id: user.id,
            type: 'expense',
            category: category.name,
            amount: Math.round(transactionAmount * 100) / 100,
            description: `Gasto en ${category.name.toLowerCase()}`,
            date: monthStart.clone().add(randomDay, 'days').format('YYYY-MM-DD')
          });
        }
      });
    }

    await Transaction.bulkCreate(transactions);
    console.log('✅ Transacciones históricas creadas');

    // Crear presupuestos para el mes actual
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    const budgets = [
      { user_id: user.id, category: 'Alimentación', planned_amount: 600, month: currentMonth, year: currentYear },
      { user_id: user.id, category: 'Transporte', planned_amount: 300, month: currentMonth, year: currentYear },
      { user_id: user.id, category: 'Entretenimiento', planned_amount: 400, month: currentMonth, year: currentYear },
      { user_id: user.id, category: 'Servicios', planned_amount: 500, month: currentMonth, year: currentYear },
      { user_id: user.id, category: 'Compras', planned_amount: 300, month: currentMonth, year: currentYear }
    ];

    await Budget.bulkCreate(budgets);
    console.log('✅ Presupuestos de prueba creados');

    // Crear metas de ahorro
    const goals = [
      {
        user_id: user.id,
        name: 'Vacaciones de verano',
        description: 'Viaje a la playa con la familia',
        target_amount: 5000,
        current_amount: 3200,
        deadline: '2025-12-31',
        category: 'Viajes',
        priority: 2
      },
      {
        user_id: user.id,
        name: 'Fondo de emergencia',
        description: 'Ahorro para emergencias e imprevistos',
        target_amount: 10000,
        current_amount: 6800,
        deadline: '2025-10-31',
        category: 'Emergencia',
        priority: 1
      },
      {
        user_id: user.id,
        name: 'Laptop nueva',
        description: 'Computadora para trabajo',
        target_amount: 1500,
        current_amount: 450,
        deadline: '2025-09-30',
        category: 'Tecnología',
        priority: 3
      },
      {
        user_id: user.id,
        name: 'Curso de inglés',
        description: 'Clases de inglés para mejorar el CV',
        target_amount: 800,
        current_amount: 200,
        deadline: '2025-11-30',
        category: 'Educación',
        priority: 2
      }
    ];

    await Goal.bulkCreate(goals);
    console.log('✅ Metas de ahorro creadas');

    // Crear desafíos simples
    const challenges = [
      {
        user_id: user.id,
        title: 'Desafío Semanal',
        description: 'Ahorra $200 esta semana',
        target_value: 200,
        current_value: 150,
        difficulty: 'Fácil',
        reward: 'Badge especial',
        end_date: moment().add(3, 'days').format('YYYY-MM-DD')
      },
      {
        user_id: user.id,
        title: 'Mes sin Caprichos',
        description: 'No gastes en entretenimiento por 30 días',
        target_value: 30,
        current_value: 18,
        difficulty: 'Difícil',
        reward: 'Badge de Disciplina',
        end_date: moment().add(12, 'days').format('YYYY-MM-DD')
      }
    ];

    await Challenge.bulkCreate(challenges);
    console.log('✅ Desafíos de prueba creados');

    // Actualizar spent_amount en presupuestos basado en transacciones reales
    for (const budget of budgets) {
      const actualSpending = await Transaction.sum('amount', {
        where: {
          user_id: user.id,
          category: budget.category,
          type: 'expense',
          date: {
            [sequelize.Op.between]: [
              moment().startOf('month').format('YYYY-MM-DD'),
              moment().endOf('month').format('YYYY-MM-DD')
            ]
          }
        }
      });

      await Budget.update(
        { spent_amount: actualSpending || 0 },
        { 
          where: { 
            user_id: user.id, 
            category: budget.category,
            month: currentMonth,
            year: currentYear
          }
        }
      );
    }

    console.log('✅ Presupuestos actualizados con gastos reales');

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('📧 Email: demo@finanzas.com');
    console.log('🔑 Contraseña: 123456');
    console.log('📊 Se crearon 6 meses de datos históricos');
    console.log('💰 Presupuestos y metas configurados');
    console.log('🎯 Desafíos activos creados');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedData();
}

module.exports = seedData;