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

async function getAllTeachers(options = {}) {
  const { where, params } = buildFilters(options);
  const limit = options.limit ?? null;
  const offset = options.offset ?? 0;
  const limitClause = limit ? ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : '';
  return query(`SELECT * FROM teachers${where} ORDER BY id DESC${limitClause}`, params);
}

function buildFilters(options = {}) {
  const where = [];
  const params = [];
  if (options.status && options.status !== 'all') {
    where.push('status = ?');
    params.push(options.status);
  }
  if (options.department_id && options.department_id !== 'all') {
    where.push('department_id = ?');
    params.push(options.department_id);
  }
  if (options.search) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR code LIKE ? OR email LIKE ? OR specialization LIKE ?)');
    const like = `%${options.search}%`;
    params.push(like, like, like, like, like);
  }
  return { where: where.length ? ` WHERE ${where.join(' AND ')}` : '', params };
}

async function countTeachers(options = {}) {
  const { where, params } = buildFilters(options);
  const rows = await query(`SELECT COUNT(*) AS total FROM teachers${where}`, params);
  return Number(rows[0]?.total ?? 0);
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

// Ensure a teacher record exists for a user account and return its id.
// If no teacher matches by email, a minimal record is created from the name.
async function ensureTeacherForUser(user) {
  const existing = await getTeacherByEmail(user.email);
  if (existing) {
    if (user.teacher_id !== existing.id) {
      await query('UPDATE users SET teacher_id = ? WHERE id = ?', [existing.id, user.id]);
    }
    return existing.id;
  }

  const nameParts = String(user.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Teacher';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const created = await createTeacher({
    first_name: firstName,
    last_name: lastName,
    email: user.email,
  });

  await query('UPDATE users SET teacher_id = ? WHERE id = ?', [created.id, user.id]);
  return created.id;
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
  countTeachers,
  getTeacherById,
  getTeacherByEmail,
  ensureTeacherForUser,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  linkUser,
};
