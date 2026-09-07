const { query } = require('../config/db');

const TEACHER_FIELDS = [
  'code',
  'first_name',
  'last_name',
  'email',
  'phone',
  'department_id',
  'gender',
  'specialization',
  'status',
  'joined_at',
];

async function getAllTeachers() {
  return query('SELECT * FROM teachers ORDER BY id DESC');
}

async function getTeacherById(id) {
  const rows = await query('SELECT * FROM teachers WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function getTeacherByEmail(email) {
  const rows = await query(
    'SELECT id, code, email FROM teachers WHERE email = ? LIMIT 1',
    [email],
  );
  return rows[0];
}

async function createTeacher(teacher) {
  const fields = TEACHER_FIELDS.filter((field) => teacher[field] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const params = fields.map((field) => teacher[field] ?? null);

  const result = await query(
    `INSERT INTO teachers (${fields.join(', ')}) VALUES (${placeholders})`,
    params,
  );

  const id = result.insertId;

  // The schema allows code to be NULL; generate a useful code when omitted.
  if (teacher.code === undefined) {
    const code = `TCH-${String(id).padStart(3, '0')}`;
    await query('UPDATE teachers SET code = ? WHERE id = ?', [code, id]);
  }

  return getTeacherById(id);
}

async function updateTeacher(id, updates) {
  const fields = Object.keys(updates).filter((field) => TEACHER_FIELDS.includes(field));
  if (fields.length === 0) return getTeacherById(id);

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const params = [...fields.map((field) => updates[field] ?? null), id];

  const result = await query(`UPDATE teachers SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;

  return getTeacherById(id);
}

async function deleteTeacher(id) {
  const result = await query('DELETE FROM teachers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function linkUser(userId, teacherId) {
  await query('UPDATE users SET teacher_id = NULL WHERE teacher_id = ?', [teacherId]);
  if (userId) {
    await query('UPDATE users SET teacher_id = ? WHERE id = ?', [teacherId, userId]);
  }
  const user = await query('SELECT id, name, email, teacher_id FROM users WHERE id = ?', [userId]);
  return user[0] ?? null;
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherByEmail,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  linkUser,
};
