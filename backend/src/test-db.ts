import { connectDatabase, disconnectDatabase } from './db/mongodb.js';
import { initDatabase } from './db/database.js';

async function testConnection() {
  try {
    console.log('🔍 Проверка подключения к MongoDB...\n');
    
    console.log('1️⃣ Подключение к базе данных...');
    const db = await connectDatabase();
    console.log('   ✅ Подключение успешно!\n');
    
    console.log('2️⃣ Список коллекций:');
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('   📝 Коллекций пока нет (это нормально для новой базы)');
    } else {
      collections.forEach(c => console.log(`   - ${c.name}`));
    }
    console.log();
    
    console.log('3️⃣ Инициализация базы данных...');
    await initDatabase();
    console.log('   ✅ Индексы созданы!\n');
    
    console.log('4️⃣ Проверка коллекций после инициализации:');
    const collectionsAfter = await db.listCollections().toArray();
    collectionsAfter.forEach(c => console.log(`   - ${c.name}`));
    console.log();
    
    await disconnectDatabase();
    console.log('✅ Все тесты пройдены успешно!');
    console.log('💡 База данных готова к работе');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Ошибка подключения к MongoDB:');
    console.error('   ', error.message);
    console.error('\n💡 Проверьте:');
    console.error('   1. Правильность строки подключения (MONGODB_URI)');
    console.error('   2. Настройки сетевого доступа в MongoDB Atlas');
    console.error('   3. Правильность username и password');
    process.exit(1);
  }
}

testConnection();

