const { db } = require('./server/db.js');
const { notices, students, users } = require('./shared/schema.js');

async function createSampleNotices() {
  try {
    console.log('🔄 Criando comunicados de exemplo...');

    const sampleNotices = [
      {
        title: 'Campeonato Interno de Jiu-Jitsu',
        content: 'Grande evento! 🥊 Nosso campeonato interno acontecerá no próximo mês. Inscrições abertas!',
        level: 'HIGH',
        audience: 'ALL',
        eventAt: new Date('2025-10-15T19:00:00'),
        publishAt: new Date(),
        isActive: true,
        createdBy: 1
      },
      {
        title: 'Mudança no Horário das Aulas',
        content: 'Informamos que a partir da próxima semana teremos alterações nos horários das aulas noturnas.',
        level: 'MEDIUM',
        audience: 'STUDENTS',
        publishAt: new Date(),
        isActive: true,
        createdBy: 1
      },
      {
        title: 'Seminário de Defesa Pessoal',
        content: 'Participem do seminário especial de defesa pessoal que acontecerá no final de semana.',
        level: 'LOW',
        audience: 'ALL',
        eventAt: new Date('2025-09-20T14:00:00'),
        publishAt: new Date(),
        isActive: true,
        createdBy: 1
      },
      {
        title: 'Nova Graduação - Cerimônia de Faixas',
        content: 'Cerimônia de graduação para os alunos que conquistaram suas novas faixas. Venham comemorar conosco!',
        level: 'HIGH',
        audience: 'ALL',
        eventAt: new Date('2025-09-25T18:00:00'),
        publishAt: new Date(),
        isActive: true,
        createdBy: 1
      }
    ];

    for (const notice of sampleNotices) {
      await db.insert(notices).values(notice);
      console.log(`✅ Comunicado criado: ${notice.title}`);
    }

    console.log('🎉 Comunicados de exemplo criados com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao criar comunicados:', error);
    process.exit(1);
  }
}

createSampleNotices();