const { query } = require('../config/db');

async function getAllSubjects(options = {}) {
  const { where, params } = buildFilters(options);
  const limit = options.limit ?? null;
  const offset = options.offset ?? 0;
  const limitClause = limit ? ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : '';
  return query(
    'SELECT id, code, name, credits, description, department_id, status FROM subjects' + where + ' ORDER BY name' + limitClause,
    params,
  );
}

function buildFilters(options = {}) {
  const where = [];
  const params = [];
  if (options.department_id && options.department_id !== 'all') {
    where.push('department_id = ?');
    params.push(options.department_id);
  }
  if (options.search) {
    where.push('(name LIKE ? OR code LIKE ?)');
    const like = `%${options.search}%`;
    params.push(like, like);
  }
  return { where: where.length ? ` WHERE ${where.join(' AND ')}` : '', params };
}

async function countSubjects(options = {}) {
  const { where, params } = buildFilters(options);
  const rows = await query(`SELECT COUNT(*) AS total FROM subjects${where}`, params);
  return Number(rows[0]?.total ?? 0);
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

module.exports = { getAllSubjects, countSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
