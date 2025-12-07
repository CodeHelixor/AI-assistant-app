const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'guest_experience_app'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : '(empty)'}\n`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'guest_experience_app'
    });

    console.log('✅ SUCCESS: Connected to MySQL database!\n');

    // Test query
    const [rows] = await connection.execute('SELECT DATABASE() as db, NOW() as time');
    console.log('Database Info:');
    console.log(`  Current Database: ${rows[0].db}`);
    console.log(`  Server Time: ${rows[0].time}\n`);

    // Check if tables exist
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || 'guest_experience_app']
    );
    console.log(`  Tables found: ${tables[0].count}\n`);

    if (tables[0].count === 0) {
      console.log('⚠️  WARNING: Database exists but has no tables!');
      console.log('   Run the schema.sql file to create tables.\n');
    } else {
      console.log('✅ Database schema is set up correctly!\n');
    }

    await connection.end();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to database!\n');
    console.error('Error details:');
    console.error(`  Code: ${error.code}`);
    console.error(`  Message: ${error.message}\n`);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Solution: Check your DB_USER and DB_PASSWORD in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Solution: Database does not exist. Create it in phpMyAdmin first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solution: MySQL server is not running. Start XAMPP MySQL.');
    }

    process.exit(1);
  }
}

testConnection();

