require('dotenv').config();
const { connectDB, getPool } = require('./src/config/database');

async function run() {
  try {
    await connectDB();
    const pool = getPool();
    await pool.request().query(`
      IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID('LessonTopics') AND name = 'book'
      )
      BEGIN
          ALTER TABLE LessonTopics ADD book NVARCHAR(500) DEFAULT N'Chung';
          PRINT 'Added book column to LessonTopics';
      END
    `);
    console.log("Successfully migrated");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
