const { Transaction, Budget, Goal, User } = require('../models');
const moment = require('moment');

const seedReportsData = async () => {
  try {
    console.log('🌱 Creando datos de prueba para reportes...');
    
    // Buscar o crear usuario de prueba
    let testUser = await User.findOne({ where: { email: 'test@test.com' } });
    
    if (!testUser) {
      testUser = await User.create({
        name: 'Usuario Prueba',
        email: 'test@test.com',
        password: '$2a$10$example', // Hash de ejemplo
      });
    }

    const userId = testUser.id;

    // Limpiar datos existentes del usuario de prueba
    await Transaction.destroy({ where: { user_id: userId } });
    await Budget.destroy({ where: { user_id: userId } });
    await Goal.destroy({ where: { user_id: userId } });

    // Crear transacciones de ejemplo - últimos 3 meses
    const transactions = [];
    const categories = {
      expenses: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Compras', 'Salud'],
      income: ['Salario', 'Freelance', 'Ventas', 'Otros']
    };

    // Generar transacciones para los últimos 3 meses
    for (let month = 0; month < 3; month++) {
      const monthStart = moment().subtract(month, 'months').startOf('month');
      const monthEnd = moment().subtract(month, 'months').endOf('month');
      
      // Generar ingresos mensuales
      const salaryDate = monthStart.clone().add(1, 'days');
      transactions.push({
        user_id: userId,
        type: 'income',
        category: 'Salario',
        amount: 3500 + Math.random() * 500, // 3500-4000
        description: 'Salario mensual',
        date: salaryDate.format('YYYY-MM-DD')
      });

      // Ingresos adicionales aleatorios
      if (Math.random() > 0.7) {
        transactions.push({
          user_id: userId,
          type: 'income',
          category: 'Freelance',
          amount: 200 + Math.random() * 800,
          description: 'Trabajo freelance',
          date: monthStart.clone().add(Math.floor(Math.random() * 28), 'days').format('YYYY-MM-DD')
        });
      }

      // Generar gastos aleatorios a lo largo del mes
      const numExpenses = 15 + Math.floor(Math.random() * 15); // 15-30 gastos por mes
      
      for (let i = 0; i < numExpenses; i++) {
        const category = categories.expenses[Math.floor(Math.random() * categories.expenses.length)];
        let amount;
        let description;

        // Amounts realistas por categoría
        switch (category) {
          case 'Comida':
            amount = 15 + Math.random() * 85; // 15-100
            description = Math.random() > 0.5 ? 'Restaurante' : 'Supermercado';
            break;
          case 'Transporte':
            amount = 5 + Math.random() * 45; // 5-50
            description = Math.random() > 0.5 ? 'Gasolina' : 'Transporte público';
            break;
          case 'Entretenimiento':
            amount = 10 + Math.random() * 90; // 10-100
            description = Math.random() > 0.5 ? 'Cine' : 'Streaming';
            break;
          case 'Servicios':
            amount = 30 + Math.random() * 170; // 30-200
            description = Math.random() > 0.5 ? 'Internet' : 'Luz';
            break;
          case 'Compras':
            amount = 20 + Math.random() * 180; // 20-200
            description = 'Compras varias';
            break;
          case 'Salud':
            amount = 25 + Math.random() * 175; // 25-200
            description = Math.random() > 0.5 ? 'Farmacia' : 'Doctor';
            break;
          default:
            amount = 10 + Math.random() * 90;
            description = 'Gasto varios';
        }

        transactions.push({
          user_id: userId,
          type: 'expense',
          category,
          amount: Math.round(amount * 100) / 100, // Redondear a 2 decimales
          description,
          date: monthStart.clone().add(Math.floor(Math.random() * 28), 'days').format('YYYY-MM-DD')
        });
      }
    }

    // Insertar todas las transacciones
    await Transaction.bulkCreate(transactions);

    // Crear presupuestos para el mes actual
    const budgets = [
      { category: 'Comida', planned_amount: 800 },
      { category: 'Transporte', planned_amount: 300 },
      { category: 'Entretenimiento', planned_amount: 200 },
      { category: 'Servicios', planned_amount: 400 },
      { category: 'Compras', planned_amount: 300 },
      { category: 'Salud', planned_amount: 150 }
    ];

    for (const budget of budgets) {
      await Budget.create({
        user_id: userId,
        category: budget.category,
        planned_amount: budget.planned_amount,
        spent_amount: 0, // Se calculará dinámicamente
        month: moment().month() + 1,
        year: moment().year(),
        is_active: true
      });
    }

    // Crear algunas metas de ahorro
    const goals = [
      {
        name: 'Vacaciones',
        target_amount: 2000,
        current_amount: 750,
        deadline: moment().add(6, 'months').format('YYYY-MM-DD'),
        category: 'Viajes',
        status: 'active'
      },
      {
        name: 'Fondo de emergencia',
        target_amount: 5000,
        current_amount: 1200,
        deadline: moment().add(12, 'months').format('YYYY-MM-DD'),
        category: 'Ahorro',
        status: 'active'
      },
      {
        name: 'Laptop nueva',
        target_amount: 1500,
        current_amount: 500,
        deadline: moment().add(4, 'months').format('YYYY-MM-DD'),
        category: 'Tecnología',
        status: 'active'
      }
    ];

    for (const goal of goals) {
      await Goal.create({
        user_id: userId,
        ...goal
      });
    }

    console.log(`✅ Datos de prueba creados exitosamente:`);
    console.log(`   📊 ${transactions.length} transacciones`);
    console.log(`   💰 ${budgets.length} presupuestos`);
    console.log(`   🎯 ${goals.length} metas`);
    console.log(`   👤 Usuario: ${testUser.email}`);
    
    return testUser;
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
};

module.exports = { seedReportsData };