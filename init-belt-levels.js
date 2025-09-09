
const { db } = require('./server/db');
const { beltLevels } = require('./shared/schema');

async function initBeltLevels() {
  console.log('🥋 Iniciando cadastro das faixas de jiu-jitsu...');

  try {
    // Faixas para Adultos
    const adultBelts = [
      {
        name: 'Faixa Branca',
        levelKey: 'white',
        colorCode: '#FFFFFF',
        category: 'adult',
        order: 1,
        active: true
      },
      {
        name: 'Faixa Azul',
        levelKey: 'blue',
        colorCode: '#0066CC',
        category: 'adult',
        order: 2,
        active: true
      },
      {
        name: 'Faixa Roxa',
        levelKey: 'purple',
        colorCode: '#6B2C91',
        category: 'adult',
        order: 3,
        active: true
      },
      {
        name: 'Faixa Marrom',
        levelKey: 'brown',
        colorCode: '#8B4513',
        category: 'adult',
        order: 4,
        active: true
      },
      {
        name: 'Faixa Preta',
        levelKey: 'black',
        colorCode: '#000000',
        category: 'adult',
        order: 5,
        active: true
      }
    ];

    // Faixas para Crianças (Sistema Infantil)
    const childBelts = [
      {
        name: 'Faixa Cinza-Branca',
        levelKey: 'grey_white',
        colorCode: '#808080',
        category: 'child',
        order: 1,
        active: true
      },
      {
        name: 'Faixa Cinza',
        levelKey: 'grey',
        colorCode: '#696969',
        category: 'child',
        order: 2,
        active: true
      },
      {
        name: 'Faixa Cinza-Preta',
        levelKey: 'grey_black',
        colorCode: '#2F2F2F',
        category: 'child',
        order: 3,
        active: true
      },
      {
        name: 'Faixa Amarela-Branca',
        levelKey: 'yellow_white',
        colorCode: '#FFD700',
        category: 'child',
        order: 4,
        active: true
      },
      {
        name: 'Faixa Amarela',
        levelKey: 'yellow',
        colorCode: '#FFCC00',
        category: 'child',
        order: 5,
        active: true
      },
      {
        name: 'Faixa Amarela-Preta',
        levelKey: 'yellow_black',
        colorCode: '#B8860B',
        category: 'child',
        order: 6,
        active: true
      },
      {
        name: 'Faixa Laranja-Branca',
        levelKey: 'orange_white',
        colorCode: '#FF8C00',
        category: 'child',
        order: 7,
        active: true
      },
      {
        name: 'Faixa Laranja',
        levelKey: 'orange',
        colorCode: '#FF6600',
        category: 'child',
        order: 8,
        active: true
      },
      {
        name: 'Faixa Laranja-Preta',
        levelKey: 'orange_black',
        colorCode: '#CC5500',
        category: 'child',
        order: 9,
        active: true
      },
      {
        name: 'Faixa Verde-Branca',
        levelKey: 'green_white',
        colorCode: '#32CD32',
        category: 'child',
        order: 10,
        active: true
      },
      {
        name: 'Faixa Verde',
        levelKey: 'green',
        colorCode: '#228B22',
        category: 'child',
        order: 11,
        active: true
      },
      {
        name: 'Faixa Verde-Preta',
        levelKey: 'green_black',
        colorCode: '#006400',
        category: 'child',
        order: 12,
        active: true
      }
    ];

    // Inserir faixas de adultos
    console.log('📝 Cadastrando faixas para adultos...');
    for (const belt of adultBelts) {
      try {
        await db.insert(beltLevels).values(belt);
        console.log(`✅ Faixa cadastrada: ${belt.name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Faixa já existe: ${belt.name}`);
        } else {
          console.error(`❌ Erro ao cadastrar ${belt.name}:`, error.message);
        }
      }
    }

    // Inserir faixas infantis
    console.log('📝 Cadastrando faixas para crianças...');
    for (const belt of childBelts) {
      try {
        await db.insert(beltLevels).values(belt);
        console.log(`✅ Faixa cadastrada: ${belt.name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Faixa já existe: ${belt.name}`);
        } else {
          console.error(`❌ Erro ao cadastrar ${belt.name}:`, error.message);
        }
      }
    }

    console.log('🎉 Cadastro de faixas concluído!');
    console.log(`📊 Total: ${adultBelts.length} faixas adulto + ${childBelts.length} faixas infantil`);

  } catch (error) {
    console.error('❌ Erro no cadastro das faixas:', error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
initBeltLevels();
