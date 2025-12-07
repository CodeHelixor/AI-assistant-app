const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'guest_experience_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection with detailed logging
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    console.log(`   Database: ${process.env.DB_NAME || 'guest_experience_app'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:');
    console.error(`   Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Check DB_USER and DB_PASSWORD in .env file');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database does not exist. Create it in phpMyAdmin.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   → MySQL server is not running. Start XAMPP MySQL.');
    }
  });

// Test function to check database status
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT DATABASE() as db, NOW() as time');
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || 'guest_experience_app']
    );
    connection.release();
    return {
      connected: true,
      database: rows[0].db,
      serverTime: rows[0].time,
      tableCount: tables[0].count
    };
  } catch (error) {
    return {
      connected: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
}

module.exports = { pool, testDatabaseConnection };


