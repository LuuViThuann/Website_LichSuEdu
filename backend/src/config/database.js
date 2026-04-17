const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'HistoryEduDB',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

// Sử dụng Windows Authentication hoặc SQL Authentication
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USER || 'sa';
  config.password = process.env.DB_PASSWORD || '';
}

let pool = null;

const connectDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log(`✅ SQL Server Connected: ${config.server} / ${config.database}`);
    return pool;
  } catch (error) {
    console.error(`❌ SQL Server Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) throw new Error('Database chưa được kết nối!');
  return pool;
};

module.exports = { connectDB, getPool, sql };