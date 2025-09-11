
const { db } = require('./server/db');
const { notices, studentNotifications, students, users } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function createSampleNotices() {
  try {
    console.log('🔍 Verificando avisos existentes...');
    
    // Verificar se já existem avisos
    const existingNotices = await db.select().from(notices);
    console.log(`📊 Avisos existentes: ${existingNotices.length}`);
    
    if (existingNotices.length === 0) {
      console.log('📢 Criando avisos de exemplo...');
      
      // Criar avisos de exemplo
      const sampleNotices = [
        {
          title: "Bem-vindo ao SenseiSystem!",
          content: "Seja bem-vindo à nossa academia! Aqui você encontrará todas as informações importantes sobre suas aulas, eventos e muito mais. Qualquer dúvida, fale com nosso Sensei.",
          level: "MEDIUM",
          audience: "ALL",
          publishAt: new Date(),
          isActive: true,
          createdBy: 1
        },
        {
          title: "Horários Especiais de Fim de Ano",
          content: "Atenção! Durante o período de dezembro, teremos horários especiais devido às festas de fim de ano. As aulas serão suspensas nos dias 24, 25 e 31 de dezembro, e 1° de janeiro. Retornaremos normalmente no dia 2 de janeiro.",
          level: "HIGH",
          audience: "STUDENTS",
          publishAt: new Date(),
          eventAt: new Date('2024-12-24'),
          isActive: true,
          createdBy: 1
        },
        {
          title: "Workshop de Defesa Pessoal",
          content: "No próximo sábado teremos um workshop especial de defesa pessoal para todos os alunos. O workshop será das 9h às 12h. Participação gratuita para alunos ativos. Tragam seus amigos!",
          level: "MEDIUM",
          audience: "STUDENTS",
          publishAt: new Date(),
          eventAt: new Date('2024-12-14'),
          isActive: true,
          createdBy: 1
        },
        {
          title: "Graduação de Fim de Ano",
          content: "A cerimônia de graduação de fim de ano será realizada no dia 15 de dezembro. Todos os alunos aptos para graduação já foram notificados individualmente. Familiares são bem-vindos para prestigiar!",
          level: "HIGH",
          audience: "ALL",
          publishAt: new Date(),
          eventAt: new Date('2024-12-15'),
          isActive: true,
          createdBy: 1
        }
      ];
      
      // Inserir avisos
      const insertedNotices = await db.insert(notices).values(sampleNotices).returning();
      console.log(`✅ ${insertedNotices.length} avisos criados`);
      
      // Buscar todos os alunos ativos
      const activeStudents = await db
        .select({ id: students.id })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(users.active, true));
      
      console.log(`👥 Alunos ativos encontrados: ${activeStudents.length}`);
      
      if (activeStudents.length > 0) {
        // Criar notificações para todos os alunos
        const notifications = [];
        for (const notice of insertedNotices) {
          if (notice.audience === 'ALL' || notice.audience === 'STUDENTS') {
            for (const student of activeStudents) {
              notifications.push({
                studentId: student.id,
                noticeId: notice.id
              });
            }
          }
        }
        
        if (notifications.length > 0) {
          await db.insert(studentNotifications).values(notifications);
          console.log(`📤 ${notifications.length} notificações criadas para alunos`);
        }
      }
      
    } else {
      console.log('ℹ️ Avisos já existem no banco de dados');
    }
    
    // Mostrar estatísticas
    const totalNotices = await db.select().from(notices);
    const totalNotifications = await db.select().from(studentNotifications);
    
    console.log('\n📊 Estatísticas:');
    console.log(`   Avisos cadastrados: ${totalNotices.length}`);
    console.log(`   Notificações enviadas: ${totalNotifications.length}`);
    
    console.log('\n🎉 Script concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao criar avisos:', error);
    process.exit(1);
  }
}

createSampleNotices();
