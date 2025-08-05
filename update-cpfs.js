// Script para atualizar CPFs dos alunos pendentes com CPFs válidos
import { CPFGenerator } from './server/utils/cpfGenerator.js';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function updateCPFs() {
  try {
    console.log('🔄 Buscando alunos pendentes...');
    
    // Buscar todos os alunos pendentes
    const pendingStudents = await sql`
      SELECT u.id, u.first_name, u.last_name, s.financial_responsible_cpf 
      FROM users u 
      JOIN students s ON u.id = s.user_id 
      WHERE u.active = false
      ORDER BY u.id
    `;
    
    console.log(`📋 Encontrados ${pendingStudents.length} alunos pendentes`);
    
    // Gerar CPFs válidos únicos
    const validCPFs = CPFGenerator.generateMultipleValidCPFs(pendingStudents.length);
    
    console.log('✅ CPFs válidos gerados:');
    validCPFs.forEach(cpf => {
      console.log(`   - ${cpf} (Válido: ${CPFGenerator.isValidCPF(cpf)})`);
    });
    
    // Atualizar cada aluno com um CPF válido
    for (let i = 0; i < pendingStudents.length; i++) {
      const student = pendingStudents[i];
      const newCPF = validCPFs[i];
      
      await sql`
        UPDATE students 
        SET financial_responsible_cpf = ${newCPF}
        WHERE user_id = ${student.id}
      `;
      
      console.log(`🔄 ${student.first_name} ${student.last_name}: ${student.financial_responsible_cpf} → ${newCPF}`);
    }
    
    console.log('✅ Todos os CPFs foram atualizados com valores válidos!');
    
    // Verificar os resultados
    const updatedStudents = await sql`
      SELECT u.id, u.first_name, u.last_name, s.financial_responsible_cpf 
      FROM users u 
      JOIN students s ON u.id = s.user_id 
      WHERE u.active = false
      ORDER BY u.id
    `;
    
    console.log('\n📊 Estado final dos alunos pendentes:');
    updatedStudents.forEach(student => {
      const isValid = CPFGenerator.isValidCPF(student.financial_responsible_cpf);
      console.log(`   - ${student.first_name} ${student.last_name}: ${student.financial_responsible_cpf} ${isValid ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar CPFs:', error);
  }
}

updateCPFs();