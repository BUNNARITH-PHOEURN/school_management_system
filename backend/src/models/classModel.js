const { query } = require('../config/db');

const CLASS_FIELDS = [
  'name',
  'academic_year_id',
  'subject_id',
  'room',
  'day',
  'start_time',
  'end_time',
  'status',
];

async function getAllClasses() {
  return query('SELECT * FROM classes ORDER BY id');
}

async function getClassById(id) {
  const rows = await query('SELECT * FROM classes WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function getClassesByTeacher(teacherId) {
  return query(
    'SELECT c.* FROM classes c JOIN class_teachers ct ON ct.class_id = c.id WHERE ct.teacher_id = ? ORDER BY c.id',
    [teacherId],
  );
}

async function createClass(cls) {
  const fields = CLASS_FIELDS.filter((f) => cls[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const params = fields.map((f) => cls[f] ?? null);

  const result = await query(
    `INSERT INTO classes (${fields.join(', ')}) VALUES (${placeholders})`,
    params,
  );

  return getClassById(result.insertId);
}

async function updateClass(id, updates) {
  const fields = Object.keys(updates).filter((f) => CLASS_FIELDS.includes(f));
  if (fields.length === 0) {
    const existing = await getClassById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [...fields.map((f) => updates[f] ?? null), id];

  const result = await query(`UPDATE classes SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getClassById(id);
}

async function deleteClass(id) {
  const result = await query('DELETE FROM classes WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllClasses,
  getClassById,
  getClassesByTeacher,
  createClass,
  updateClass,
  deleteClass,
};