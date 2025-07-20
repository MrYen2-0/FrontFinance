// back/utils/seedData.js
const { User, Transaction, Budget, Goal } = require('../models');
const bcrypt = require('bcryptjs');
const moment = require('moment');

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Buscar o crear usuario de prueba
    let user = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      console.log('✅ Usuario de prueba creado');
    }

    // Crear transacciones de los últimos 6 meses
    console.log('📝 Creando transacciones...');
    
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = moment().subtract(monthOffset, 'months');
      
      // Ingresos del mes
      await Transaction.create({
        user_id: user.id,
        type: 'income',
        category: 'Salario',
        amount: 3500 + Math.random() * 500,
        description: 'Salario mensual',
        date: monthDate.clone().date(5).toDate()
      });
      
      // Freelance ocasional
      if (Math.random() > 0.5) {
        await Transaction.create({
          user_id: user.id,
          type: 'income',
          category: 'Freelance',
          amount: 500 + Math.random() * 1000,
          description: 'Proyecto freelance',
          date: monthDate.clone().date(15).toDate()
        });
      }
      
      // Gastos variados durante el mes
      const categories = [
        { name: 'Alimentación', min: 400, max: 600, count: 8 },
        { name: 'Transporte', min: 100, max: 200, count: 6 },
        { name: 'Servicios', min: 150, max: 250, count: 3 },
        { name: 'Entretenimiento', min: 50, max: 200, count: 4 },
        { name: 'Salud', min: 50, max: 300, count: 2 }
      ];
      
      for (const cat of categories) {
        for (let i = 0; i < cat.count; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          await Transaction.create({
            user_id: user.id,
            type: 'expense',
            category: cat.name,
            amount: cat.min + Math.random() * (cat.max - cat.min),
            description: `Gasto en ${cat.name.toLowerCase()}`,
            date: monthDate.clone().date(day).toDate()
          });
        }
      }
    }
    
    console.log('✅ Transacciones creadas');

    // Crear presupuestos para el mes actual
    console.log('💰 Creando presupuestos...');
    
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();
    
    const budgetCategories = [
      { category: 'Alimentación', amount: 600 },
      { category: 'Transporte', amount: 300 },
      { category: 'Servicios', amount: 250 },
      { category: 'Entretenimiento', amount: 200 },
      { category: 'Salud', amount: 150 }
    ];
    
    for (const budget of budgetCategories) {
      // Calcular gasto actual
      const spent = await Transaction.sum('amount', {
        where: {
          user_id: user.id,
          category: budget.category,
          type: 'expense',
          date: {
            [Op.gte]: moment().startOf('month').toDate(),
            [Op.lte]: moment().endOf('month').toDate()
          }
        }
      }) || 0;
      
      await Budget.findOrCreate({
        where: {
          user_id: user.id,
          category: budget.category,
          month: currentMonth,
          year: currentYear
        },
        defaults: {
          planned_amount: budget.amount,
          spent_amount: spent
        }
      });
    }
    
    console.log('✅ Presupuestos creados');

    // Crear metas
    console.log('🎯 Creando metas...');
    
    const goals = [
      {
        name: 'Fondo de Emergencia',
        category: 'Emergencia',
        target_amount: 10000,
        current_amount: 3500,
        deadline: moment().add(6, 'months').toDate()
      },
      {
        name: 'Vacaciones de Verano',
        category: 'Viajes',
        target_amount: 5000,
        current_amount: 1200,
        deadline: moment().add(8, 'months').toDate()
      },
      {
        name: 'MacBook Pro',
        category: 'Compras',
        target_amount: 2500,
        current_amount: 800,
        deadline: moment().add(4, 'months').toDate()
      }
    ];
    
    for (const goal of goals) {
      await Goal.findOrCreate({
        where: {
          user_id: user.id,
          name: goal.name
        },
        defaults: {
          ...goal,
          user_id: user.id
        }
      });
    }
    
    console.log('✅ Metas creadas');
    console.log('🎉 Seed completado exitosamente');
    console.log('\n📌 Credenciales de acceso:');
    console.log('Email: test@example.com');
    console.log('Password: test123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

// Verificar que Op esté importado
const { Op } = require('sequelize');

seedDatabase();