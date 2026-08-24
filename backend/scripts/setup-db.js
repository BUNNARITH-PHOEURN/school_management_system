require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await connection.query(
    'CREATE DATABASE IF NOT EXISTS `' + (process.env.DB_NAME || 'school_management') + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  console.log('Database ready:', process.env.DB_NAME);

  await connection.changeUser({ database: process.env.DB_NAME || 'school_management' });

  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await connection.query(schema);
  console.log('Schema executed (all tables created if missing)');

  const [tables] = await connection.query('SHOW TABLES');
  console.log('Tables:', tables.map((t) => Object.values(t)[0]).join(', '));

  await connection.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
