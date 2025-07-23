const { sequelize } = require('./models');
const { seedReportsData } = require('./utils/seedReports');

async function runSeed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    await seedReportsData();
    
    console.log('🎉 ¡Seeder completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
    process.exit(1);
  }
}

runSeed();