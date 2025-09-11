
<old_str>const { db } = require('./server/db.js');
const { notices, studentNotifications, students, users } = require('./shared/schema.js');
const { eq } = require('drizzle-orm');

async function createSampleNotices() {
  console.log('🔔 Criando avisos de exemplo...');

  try {
    // Primeiro, buscar um usuário admin para ser o criador
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (adminUser.length === 0) {
      console.error('❌ Nenhum usuário admin encontrado. Crie um admin primeiro.');
      return;
    }

    const createdBy = adminUser[0].id;

    // Avisos de exemplo
    const sampleNotices = [
      {
        title: 'Bem-vindo ao SenseiSystem! 🥋',
        content: 'Seja bem-vindo(a) ao nosso sistema! Aqui você pode acompanhar suas aulas, confirmar presenças e ficar por dentro de todos os eventos da academia.',
        level: 'MEDIUM',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: null,
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Graduação de Faixas - Setembro 2024 🏆',
        content: 'A cerimônia de graduação será realizada no dia 28 de setembro. Os alunos aprovados receberão comunicado individual na próxima semana. Parabéns pelo empenho!',
        level: 'HIGH',
        audience: 'STUDENTS',
        publishAt: new Date(),
        eventAt: new Date('2024-09-28'),
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Seminário Técnico com Mestre Carlos 📚',
        content: 'Grande oportunidade de aprendizado! Seminário técnico especial no próximo sábado às 14h. Inscrições na recepção até sexta-feira.',
        level: 'HIGH',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próxima semana
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Alteração de Horário - Aula Quinta 📅',
        content: 'A aula de quinta-feira das 19h será antecipada para 18h30 devido ao evento especial. Ajustem suas agendas!',
        level: 'MEDIUM',
        audience: 'STUDENTS',
        publishAt: new Date(),
        eventAt: null,
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Limpeza e Manutenção do Tatame 🧹',
        content: 'Mutirão de limpeza e manutenção do tatame no domingo pela manhã. Contamos com a participação de todos para manter nossa academia sempre em ordem!',
        level: 'LOW',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Daqui a 3 dias
        createdBy: createdBy,
        isActive: true
      }
    ];

    // Inserir avisos
    const insertedNotices = await db
      .insert(notices)
      .values(sampleNotices)
      .returning();

    console.log(`✅ ${insertedNotices.length} avisos criados com sucesso!`);

    // Criar notificações para todos os alunos ativos
    const activeStudents = await db
      .select({ id: students.id })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(users.active, true));

    console.log(`📤 Criando notificações para ${activeStudents.length} alunos...`);

    if (activeStudents.length > 0) {
      const notifications = [];
      
      for (const notice of insertedNotices) {
        // Avisos para todos ou apenas para estudantes
        if (notice.audience === 'ALL' || notice.audience === 'STUDENTS') {
          for (const student of activeStudents) {
            notifications.push({
              studentId: student.id,
              noticeId: notice.id,
              readAt: null // Não lido inicialmente
            });
          }
        }
      }

      if (notifications.length > 0) {
        await db.insert(studentNotifications).values(notifications);
        console.log(`✅ ${notifications.length} notificações criadas!`);
      }
    }

    console.log('🎉 Avisos de exemplo criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar avisos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSampleNotices()
    .then(() => {
      console.log('✅ Script concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error);
      process.exit(1);
    });
}

module.exports = { createSampleNotices };</old_str>
<new_str>const { db } = require('./server/db.js');
const { notices, studentNotifications, students, users } = require('./shared/schema.js');
const { eq } = require('drizzle-orm');

async function createSampleNotices() {
  console.log('🔔 Criando avisos de exemplo...');

  try {
    // Primeiro, buscar um usuário admin para ser o criador
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (adminUser.length === 0) {
      console.error('❌ Nenhum usuário admin encontrado. Crie um admin primeiro.');
      return;
    }

    const createdBy = adminUser[0].id;

    // Avisos de exemplo
    const sampleNotices = [
      {
        title: 'Bem-vindo ao SenseiSystem! 🥋',
        content: 'Seja bem-vindo(a) ao nosso sistema! Aqui você pode acompanhar suas aulas, confirmar presenças e ficar por dentro de todos os eventos da academia.',
        level: 'MEDIUM',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: null,
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Graduação de Faixas - Setembro 2024 🏆',
        content: 'A cerimônia de graduação será realizada no dia 28 de setembro. Os alunos aprovados receberão comunicado individual na próxima semana. Parabéns pelo empenho!',
        level: 'HIGH',
        audience: 'STUDENTS',
        publishAt: new Date(),
        eventAt: new Date('2024-09-28'),
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Seminário Técnico com Mestre Carlos 📚',
        content: 'Grande oportunidade de aprendizado! Seminário técnico especial no próximo sábado às 14h. Inscrições na recepção até sexta-feira.',
        level: 'HIGH',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próxima semana
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Alteração de Horário - Aula Quinta 📅',
        content: 'A aula de quinta-feira das 19h será antecipada para 18h30 devido ao evento especial. Ajustem suas agendas!',
        level: 'MEDIUM',
        audience: 'STUDENTS',
        publishAt: new Date(),
        eventAt: null,
        createdBy: createdBy,
        isActive: true
      },
      {
        title: 'Limpeza e Manutenção do Tatame 🧹',
        content: 'Mutirão de limpeza e manutenção do tatame no domingo pela manhã. Contamos com a participação de todos para manter nossa academia sempre em ordem!',
        level: 'LOW',
        audience: 'ALL',
        publishAt: new Date(),
        eventAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Daqui a 3 dias
        createdBy: createdBy,
        isActive: true
      }
    ];

    // Inserir avisos
    const insertedNotices = await db
      .insert(notices)
      .values(sampleNotices)
      .returning();

    console.log(`✅ ${insertedNotices.length} avisos criados com sucesso!`);

    // Criar notificações para todos os alunos ativos
    const activeStudents = await db
      .select({ id: students.id })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(users.active, true));

    console.log(`📤 Criando notificações para ${activeStudents.length} alunos...`);

    if (activeStudents.length > 0) {
      const notifications = [];
      
      for (const notice of insertedNotices) {
        // Avisos para todos ou apenas para estudantes
        if (notice.audience === 'ALL' || notice.audience === 'STUDENTS') {
          for (const student of activeStudents) {
            notifications.push({
              studentId: student.id,
              noticeId: notice.id,
              readAt: null // Não lido inicialmente
            });
          }
        }
      }

      if (notifications.length > 0) {
        await db.insert(studentNotifications).values(notifications);
        console.log(`✅ ${notifications.length} notificações criadas!`);
      }
    }

    console.log('🎉 Avisos de exemplo criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar avisos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSampleNotices()
    .then(() => {
      console.log('✅ Script concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error);
      process.exit(1);
    });
}

module.exports = { createSampleNotices };</new_str>
