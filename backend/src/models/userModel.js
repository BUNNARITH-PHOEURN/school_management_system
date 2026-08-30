const { query } = require('../config/db');

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0];
}

async function findById(id) {
  const rows = await query(
    'SELECT id, name, email, role, status, teacher_id, last_login FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0];
}

async function updateLastLogin(id, lastLogin) {
  await query('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, id]);
}

module.exports = { findByEmail, findById, updateLastLogin };