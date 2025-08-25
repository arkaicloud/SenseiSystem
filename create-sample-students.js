
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:5000';

// Dados de alunos de exemplo
const sampleStudents = [
  {
    firstName: "Carlos",
    lastName: "Silva",
    email: "carlos.silva@email.com",
    phone: "(11) 99999-1111",
    cpf: "123.456.789-01",
    rg: "12.345.678-9",
    birthDate: "1995-03-15",
    street: "Rua das Flores, 123",
    number: "123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    beltLevel: "white",
    stripes: 0,
    emergencyContact: "Maria Silva",
    emergencyPhone: "(11) 99999-2222",
    financialResponsibleRelationship: "self",
    password: "12345678"
  },
  {
    firstName: "Ana",
    lastName: "Costa",
    email: "ana.costa@email.com",
    phone: "(11) 99999-3333",
    cpf: "234.567.890-12",
    rg: "23.456.789-0",
    birthDate: "1992-07-22",
    street: "Avenida Paulista, 456",
    number: "456",
    neighborhood: "Bela Vista",
    city: "São Paulo", 
    state: "SP",
    zipCode: "01310-100",
    beltLevel: "blue",
    stripes: 2,
    emergencyContact: "João Costa",
    emergencyPhone: "(11) 99999-4444",
    financialResponsibleRelationship: "self",
    password: "12345678"
  },
  {
    firstName: "Pedro",
    lastName: "Santos",
    email: "pedro.santos@email.com",
    phone: "(11) 99999-5555",
    cpf: "345.678.901-23",
    rg: "34.567.890-1",
    birthDate: "1988-12-10",
    street: "Rua Augusta, 789",
    number: "789",
    neighborhood: "Consolação",
    city: "São Paulo",
    state: "SP", 
    zipCode: "01305-000",
    beltLevel: "purple",
    stripes: 1,
    emergencyContact: "Lucia Santos",
    emergencyPhone: "(11) 99999-6666",
    financialResponsibleRelationship: "self",
    password: "12345678"
  },
  {
    firstName: "Mariana",
    lastName: "Oliveira",
    email: "mariana.oliveira@email.com",
    phone: "(11) 99999-7777",
    cpf: "456.789.012-34",
    rg: "45.678.901-2",
    birthDate: "1990-05-18",
    street: "Rua Oscar Freire, 321",
    number: "321",
    neighborhood: "Jardins",
    city: "São Paulo",
    state: "SP",
    zipCode: "01426-001",
    beltLevel: "white",
    stripes: 3,
    emergencyContact: "Carlos Oliveira",
    emergencyPhone: "(11) 99999-8888",
    financialResponsibleRelationship: "self",
    password: "12345678"
  },
  {
    firstName: "Roberto",
    lastName: "Ferreira",
    email: "roberto.ferreira@email.com",
    phone: "(11) 99999-9999",
    cpf: "567.890.123-45",
    rg: "56.789.012-3",
    birthDate: "1985-09-03",
    street: "Rua da Consolação, 654",
    number: "654",
    neighborhood: "República",
    city: "São Paulo",
    state: "SP",
    zipCode: "01302-907",
    beltLevel: "brown",
    stripes: 0,
    emergencyContact: "Sandra Ferreira",
    emergencyPhone: "(11) 99999-0000",
    financialResponsibleRelationship: "self",
    password: "12345678"
  }
];

async function createStudent(studentData) {
  try {
    console.log(`📝 Criando aluno: ${studentData.firstName} ${studentData.lastName}`);
    
    const response = await fetch(`${baseUrl}/api/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Aluno criado com sucesso: ${studentData.firstName} ${studentData.lastName}`);
      console.log(`   Status: ${result.student?.status || 'pending'}`);
      console.log(`   ID: ${result.student?.id || 'N/A'}`);
    } else {
      console.log(`❌ Erro ao criar aluno ${studentData.firstName} ${studentData.lastName}:`);
      console.log(`   ${result.message || 'Erro desconhecido'}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Erro de conexão ao criar ${studentData.firstName} ${studentData.lastName}:`, error.message);
    return null;
  }
}

async function createAllStudents() {
  console.log('🎯 Iniciando criação de alunos de exemplo...\n');
  
  for (const student of sampleStudents) {
    await createStudent(student);
    console.log(''); // Linha em branco para separar
    
    // Pequena pausa entre criações para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎉 Processo concluído!');
  console.log('\n📋 Resumo:');
  console.log(`   - ${sampleStudents.length} alunos processados`);
  console.log('   - Todos os alunos foram criados com status "pending" aguardando aprovação');
  console.log('   - Acesse o painel administrativo para aprovar os alunos');
}

// Executar o script
createAllStudents().catch(console.error);
