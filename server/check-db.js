const { testDatabaseConnection } = require('./config/database');

async function check() {
  console.log('\n=== Database Connection Test ===\n');
  const result = await testDatabaseConnection();
  
  if (result.connected) {
    console.log('✅ Database is CONNECTED!');
    console.log(`   Database: ${result.database}`);
    console.log(`   Tables: ${result.tableCount}`);
    console.log(`   Server Time: ${result.serverTime}\n`);
  } else {
    console.log('❌ Database is NOT connected!');
    console.log(`   Error Code: ${result.error.code}`);
    console.log(`   Error Message: ${result.error.message}\n`);
    
    if (result.error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Fix: Check DB_USER and DB_PASSWORD in .env file');
    } else if (result.error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Fix: Create database "guest_experience_app" in phpMyAdmin');
    } else if (result.error.code === 'ECONNREFUSED') {
      console.log('💡 Fix: Start MySQL in XAMPP');
    }
  }
  
  process.exit(result.connected ? 0 : 1);
}

check();

