const { query } = require('../config/db');

async function list() {
  return query(`
    SELECT d.id, d.code, d.name, d.description, d.status, d.created_at,
      (SELECT COUNT(*) FROM students s WHERE s.department_id = d.id AND s.status = 'active') AS student_count,
      (SELECT COUNT(*) FROM teachers t WHERE t.department_id = d.id AND t.status = 'active') AS teacher_count
    FROM departments d ORDER BY d.name
  `);
}

async function findById(id) {
  const rows = await query('SELECT id, code, name, description, status, created_at FROM departments WHERE id = ?', [id]);
  return rows[0];
}

async function create(data) {
  const result = await query('INSERT INTO departments (code, name, description, status) VALUES (?, ?, ?, ?)', [data.code, data.name, data.description || null, 'active']);
  return findById(result.insertId);
}

async function update(id, data) {
  await query('UPDATE departments SET code = ?, name = ?, description = ? WHERE id = ?', [data.code, data.name, data.description || null, id]);
  return findById(id);
}

async function updateStatus(id, status) {
  await query('UPDATE departments SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

module.exports = { list, create, update, updateStatus };