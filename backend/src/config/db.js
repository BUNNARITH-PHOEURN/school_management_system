require('dotenv').config();

const mysql = require('mysql2/promise');

// ============================================================
// TODO: Configure your database connection here.
// Option A: fill in the values directly below.
// Option B: set DB_HOST / DB_PORT / DB_USER / DB_PASSWORD /
//           DB_NAME environment variables (e.g. via dotenv).
// ============================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
});

// Full database schema (all tables & relationships) lives in backend/schema.sql.
// Run `node scripts/setup-db.js` to create the database and all tables.

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, query };
