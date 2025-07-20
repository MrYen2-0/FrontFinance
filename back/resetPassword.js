// back/resetPassword.js
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function resetPassword() {
  try {
    const email = 'test@example.com';
    const newPassword = 'test123';
    
    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Actualizar el usuario
    const result = await User.update(
      { password: hashedPassword },
      { where: { email } }
    );
    
    if (result[0] > 0) {
      console.log(`✅ Contraseña actualizada para ${email}`);
      console.log(`Nueva contraseña: ${newPassword}`);
    } else {
      console.log(`❌ No se encontró el usuario con email: ${email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();