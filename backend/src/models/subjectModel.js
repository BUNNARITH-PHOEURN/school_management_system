const { query } = require('../config/db');

async function getAllSubjects() {
  return query(
    'SELECT id, code, name, credits, description, department_id, status FROM subjects ORDER BY name',
  );
}

async function getSubjectById(id) {
  const rows = await query(
    'SELECT id, code, name, credits, description, department_id, status FROM subjects WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0];
}

async function createSubject(data) {
  const result = await query(
    'INSERT INTO subjects (code, name, credits, description, department_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    [data.code, data.name, data.credits, data.description || null, data.department_id, data.status || 'active'],
  );
  return getSubjectById(result.insertId);
}

async function updateSubject(id, data) {
  const fields = Object.keys(data);
  if (!fields.length) return getSubjectById(id);
  const values = fields.map(field => data[field]);
  await query(`UPDATE subjects SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`, [...values, id]);
  return getSubjectById(id);
}

async function deleteSubject(id) {
  const result = await query('DELETE FROM subjects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
