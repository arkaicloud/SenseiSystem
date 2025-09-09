
import { db } from './server/db.js';
import { classes } from './shared/schema.js';

const sampleClasses = [
  // DOMINGO (0)
  { name: 'Iniciantes - Domingo Manhã', description: 'Aula para iniciantes no domingo de manhã', instructorId: 2, dayOfWeek: 0, startTime: '09:00', duration: 90, maxCapacity: 20 },
  { name: 'Intermediário - Domingo Tarde', description: 'Aula para intermediários no domingo à tarde', instructorId: 2, dayOfWeek: 0, startTime: '15:00', duration: 90, maxCapacity: 15 },
  { name: 'Open Mat - Domingo Noite', description: 'Treino livre no domingo à noite', instructorId: 2, dayOfWeek: 0, startTime: '19:00', duration: 120, maxCapacity: 25 },

  // SEGUNDA-FEIRA (1)
  { name: 'Iniciantes - Segunda Manhã', description: 'Aula para iniciantes na segunda de manhã', instructorId: 2, dayOfWeek: 1, startTime: '08:00', duration: 90, maxCapacity: 20 },
  { name: 'Intermediário - Segunda Manhã', description: 'Aula para intermediários na segunda de manhã', instructorId: 2, dayOfWeek: 1, startTime: '09:45', duration: 90, maxCapacity: 15 },
  { name: 'Kids - Segunda Tarde', description: 'Aula para crianças na segunda à tarde', instructorId: 2, dayOfWeek: 1, startTime: '16:00', duration: 60, maxCapacity: 18 },
  { name: 'Teens - Segunda Tarde', description: 'Aula para adolescentes na segunda à tarde', instructorId: 2, dayOfWeek: 1, startTime: '17:15', duration: 75, maxCapacity: 15 },
  { name: 'Iniciantes - Segunda Noite', description: 'Aula para iniciantes na segunda à noite', instructorId: 2, dayOfWeek: 1, startTime: '19:00', duration: 90, maxCapacity: 25 },
  { name: 'Avançado - Segunda Noite', description: 'Aula para avançados na segunda à noite', instructorId: 2, dayOfWeek: 1, startTime: '20:45', duration: 90, maxCapacity: 12 },

  // TERÇA-FEIRA (2)
  { name: 'Feminino - Terça Manhã', description: 'Aula exclusiva feminina na terça de manhã', instructorId: 2, dayOfWeek: 2, startTime: '08:30', duration: 90, maxCapacity: 16 },
  { name: 'Iniciantes - Terça Manhã', description: 'Aula para iniciantes na terça de manhã', instructorId: 2, dayOfWeek: 2, startTime: '10:00', duration: 90, maxCapacity: 20 },
  { name: 'Kids - Terça Tarde', description: 'Aula para crianças na terça à tarde', instructorId: 2, dayOfWeek: 2, startTime: '15:30', duration: 60, maxCapacity: 18 },
  { name: 'Intermediário - Terça Tarde', description: 'Aula para intermediários na terça à tarde', instructorId: 2, dayOfWeek: 2, startTime: '17:00', duration: 90, maxCapacity: 15 },
  { name: 'Iniciantes - Terça Noite', description: 'Aula para iniciantes na terça à noite', instructorId: 2, dayOfWeek: 2, startTime: '19:30', duration: 90, maxCapacity: 25 },
  { name: 'Competição - Terça Noite', description: 'Treino focado em competição na terça à noite', instructorId: 2, dayOfWeek: 2, startTime: '21:00', duration: 90, maxCapacity: 10 },

  // QUARTA-FEIRA (3)
  { name: 'Iniciantes - Quarta Manhã', description: 'Aula para iniciantes na quarta de manhã', instructorId: 2, dayOfWeek: 3, startTime: '08:00', duration: 90, maxCapacity: 20 },
  { name: 'Intermediário - Quarta Manhã', description: 'Aula para intermediários na quarta de manhã', instructorId: 2, dayOfWeek: 3, startTime: '09:45', duration: 90, maxCapacity: 15 },
  { name: 'Kids - Quarta Tarde', description: 'Aula para crianças na quarta à tarde', instructorId: 2, dayOfWeek: 3, startTime: '16:00', duration: 60, maxCapacity: 18 },
  { name: 'Teens - Quarta Tarde', description: 'Aula para adolescentes na quarta à tarde', instructorId: 2, dayOfWeek: 3, startTime: '17:15', duration: 75, maxCapacity: 15 },
  { name: 'Iniciantes - Quarta Noite', description: 'Aula para iniciantes na quarta à noite', instructorId: 2, dayOfWeek: 3, startTime: '19:00', duration: 90, maxCapacity: 25 },
  { name: 'Avançado - Quarta Noite', description: 'Aula para avançados na quarta à noite', instructorId: 2, dayOfWeek: 3, startTime: '20:45', duration: 90, maxCapacity: 12 },

  // QUINTA-FEIRA (4)
  { name: 'No-Gi - Quinta Manhã', description: 'Aula sem kimono na quinta de manhã', instructorId: 2, dayOfWeek: 4, startTime: '08:30', duration: 90, maxCapacity: 18 },
  { name: 'Iniciantes - Quinta Manhã', description: 'Aula para iniciantes na quinta de manhã', instructorId: 2, dayOfWeek: 4, startTime: '10:00', duration: 90, maxCapacity: 20 },
  { name: 'Kids - Quinta Tarde', description: 'Aula para crianças na quinta à tarde', instructorId: 2, dayOfWeek: 4, startTime: '15:30', duration: 60, maxCapacity: 18 },
  { name: 'Intermediário - Quinta Tarde', description: 'Aula para intermediários na quinta à tarde', instructorId: 2, dayOfWeek: 4, startTime: '17:00', duration: 90, maxCapacity: 15 },
  { name: 'Iniciantes - Quinta Noite', description: 'Aula para iniciantes na quinta à noite', instructorId: 2, dayOfWeek: 4, startTime: '19:30', duration: 90, maxCapacity: 25 },
  { name: 'Drilling - Quinta Noite', description: 'Treino técnico intensivo na quinta à noite', instructorId: 2, dayOfWeek: 4, startTime: '21:00', duration: 75, maxCapacity: 20 },

  // SEXTA-FEIRA (5)
  { name: 'Iniciantes - Sexta Manhã', description: 'Aula para iniciantes na sexta de manhã', instructorId: 2, dayOfWeek: 5, startTime: '08:00', duration: 90, maxCapacity: 20 },
  { name: 'Intermediário - Sexta Manhã', description: 'Aula para intermediários na sexta de manhã', instructorId: 2, dayOfWeek: 5, startTime: '09:45', duration: 90, maxCapacity: 15 },
  { name: 'Kids - Sexta Tarde', description: 'Aula para crianças na sexta à tarde', instructorId: 2, dayOfWeek: 5, startTime: '16:00', duration: 60, maxCapacity: 18 },
  { name: 'Teens - Sexta Tarde', description: 'Aula para adolescentes na sexta à tarde', instructorId: 2, dayOfWeek: 5, startTime: '17:15', duration: 75, maxCapacity: 15 },
  { name: 'Iniciantes - Sexta Noite', description: 'Aula para iniciantes na sexta à noite', instructorId: 2, dayOfWeek: 5, startTime: '19:00', duration: 90, maxCapacity: 25 },
  { name: 'Sparring - Sexta Noite', description: 'Treino de sparring na sexta à noite', instructorId: 2, dayOfWeek: 5, startTime: '20:45', duration: 90, maxCapacity: 20 },

  // SÁBADO (6)
  { name: 'Iniciantes - Sábado Manhã', description: 'Aula para iniciantes no sábado de manhã', instructorId: 2, dayOfWeek: 6, startTime: '09:00', duration: 90, maxCapacity: 20 },
  { name: 'Intermediário - Sábado Manhã', description: 'Aula para intermediários no sábado de manhã', instructorId: 2, dayOfWeek: 6, startTime: '10:45', duration: 90, maxCapacity: 15 },
  { name: 'Kids - Sábado Tarde', description: 'Aula para crianças no sábado à tarde', instructorId: 2, dayOfWeek: 6, startTime: '14:00', duration: 60, maxCapacity: 20 },
  { name: 'Open Mat - Sábado Tarde', description: 'Treino livre no sábado à tarde', instructorId: 2, dayOfWeek: 6, startTime: '15:30', duration: 120, maxCapacity: 30 },
  { name: 'Seminário - Sábado Noite', description: 'Seminário especial no sábado à noite', instructorId: 2, dayOfWeek: 6, startTime: '18:00', duration: 120, maxCapacity: 25 }
];

async function createSampleClasses() {
  try {
    console.log('🏃 Criando aulas de exemplo...');
    
    // Verificar se já existem aulas
    const existingClasses = await db.select().from(classes).limit(1);
    
    if (existingClasses.length > 0) {
      console.log('⚠️ Já existem aulas no sistema. Continuando mesmo assim...');
    }

    // Inserir aulas
    let created = 0;
    for (const classData of sampleClasses) {
      try {
        await db.insert(classes).values({
          name: classData.name,
          description: classData.description,
          instructorId: classData.instructorId,
          dayOfWeek: classData.dayOfWeek,
          startTime: classData.startTime,
          duration: classData.duration,
          maxCapacity: classData.maxCapacity,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
        console.log(`✅ Criada: ${classData.name}`);
      } catch (error) {
        console.error(`❌ Erro ao criar ${classData.name}:`, error.message);
      }
    }

    console.log(`🎉 ${created} aulas criadas com sucesso!`);
    console.log('\n📅 Resumo das aulas criadas:');
    console.log('- Domingo: 3 aulas (Manhã, Tarde, Noite)');
    console.log('- Segunda: 6 aulas (2 Manhã, 2 Tarde, 2 Noite)');
    console.log('- Terça: 6 aulas (2 Manhã, 2 Tarde, 2 Noite)');
    console.log('- Quarta: 6 aulas (2 Manhã, 2 Tarde, 2 Noite)');
    console.log('- Quinta: 6 aulas (2 Manhã, 2 Tarde, 2 Noite)');
    console.log('- Sexta: 6 aulas (2 Manhã, 2 Tarde, 2 Noite)');
    console.log('- Sábado: 5 aulas (2 Manhã, 3 Tarde/Noite)');
    console.log(`\nTotal: ${created} aulas criadas`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

createSampleClasses();
