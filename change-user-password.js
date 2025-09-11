
const { db } = require('./server/db.js');
const { users } = require('./shared/schema.js');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

async function changeUserPassword() {
  try {
    const email = 'leosouzaa10@gmail.com';
    const newPassword = 'NovaSenha2025!';
    
    console.log(`🔄 Alterando senha para o usuário: ${email}`);
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar a senha no banco
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();
    
    if (result.length > 0) {
      console.log(`✅ Senha alterada com sucesso para: ${email}`);
      console.log(`🔐 Nova senha: ${newPassword}`);
      console.log(`👤 Usuário: ${result[0].firstName} ${result[0].lastName}`);
      console.log(`📧 Email: ${result[0].email}`);
      console.log(`🎯 Role: ${result[0].role}`);
      console.log(`✅ Status: ${result[0].active ? 'Ativo' : 'Inativo'}`);
    } else {
      console.log(`❌ Usuário não encontrado: ${email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    process.exit(1);
  }
}

changeUserPassword();
