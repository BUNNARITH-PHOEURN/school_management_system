const { query } = require('../config/db');

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0];
}

async function findById(id) {
  const rows = await query(
    'SELECT id, name, email, phone, bio, avatar_url, role, status, teacher_id, student_id, created_at, last_login FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0];
}

async function list() {
  return query(
    'SELECT id, name, email, phone, bio, avatar_url, role, status, teacher_id, student_id, created_at, last_login FROM users ORDER BY name',
  );
}

async function create({ name, email, passwordHash, role, avatarUrl, studentId }) {
  const hasExplicitRole = role !== undefined;
  const result = hasExplicitRole
    ? await query(
      `INSERT INTO users (name, email, password_hash, role, status, avatar_url, student_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role, 'active', avatarUrl ?? null, studentId ?? null],
    )
    : await query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, 'student', 'active')`,
      [name, email, passwordHash],
    );
  return {
    id: result.insertId,
    name,
    email,
    role: role || 'student',
    status: 'active',
    last_login: null,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

async function update(id, data) {
  const fields = [];
  const values = [];
  for (const [field, value] of Object.entries(data)) {
    fields.push(`${field} = ?`);
    values.push(value);
  }
  if (fields.length) {
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  return findById(id);
}

async function updateLastLogin(id, lastLogin) {
  await query('UPDATE users SET last_login = ? WHERE id = ?', [lastLogin, id]);
}

async function remove(id) {
  const result = await query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findByEmail, findById, list, update, updateLastLogin, create, remove };
