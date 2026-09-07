const { query } = require('../config/db');

const STUDENT_FIELDS = [
  'code',
  'first_name',
  'last_name',
  'email',
  'phone',
  'department_id',
  'gender',
  'date_of_birth',
  'address',
  'status',
  'enrolled_at',
];

async function getAllStudents() {
  return query(
    `SELECT id, code, first_name, last_name, email, phone, department_id, gender,
      DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth, address, status,
      DATE_FORMAT(enrolled_at, '%Y-%m-%d') AS enrolled_at, created_at
     FROM students ORDER BY id DESC`,
  );
}

async function getStudentById(id) {
  const rows = await query(
    `SELECT id, code, first_name, last_name, email, phone, department_id, gender,
      DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth, address, status,
      DATE_FORMAT(enrolled_at, '%Y-%m-%d') AS enrolled_at, created_at
     FROM students WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0];
}

async function getStudentByEmail(email) {
  const rows = await query(
    'SELECT id, code, email FROM students WHERE email = ? LIMIT 1',
    [email],
  );
  return rows[0];
}

// Ensure a student record exists for a user account and return its id.
// If no student matches by email, a minimal record is created from the name.
async function ensureStudentForUser(user) {
  const existing = await getStudentByEmail(user.email);
  if (existing) {
    if (user.student_id !== existing.id) {
      await query('UPDATE users SET student_id = ? WHERE id = ?', [existing.id, user.id]);
    }
    return existing.id;
  }

  const nameParts = String(user.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Student';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const created = await createStudent({
    first_name: firstName,
    last_name: lastName,
    email: user.email,
  });

  await query('UPDATE users SET student_id = ? WHERE id = ?', [created.id, user.id]);
  return created.id;
}

async function createStudent(student) {
  const fields = STUDENT_FIELDS.filter((f) => student[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const params = fields.map((f) => student[f] ?? null);

  const result = await query(
    `INSERT INTO students (${fields.join(', ')}) VALUES (${placeholders})`,
    params,
  );

  const id = result.insertId;

  if (student.code === undefined) {
    const code = `STU-${String(id).padStart(3, '0')}`;
    await query('UPDATE students SET code = ? WHERE id = ?', [code, id]);
  }

  return getStudentById(id);
}

async function updateStudent(id, updates) {
  const fields = Object.keys(updates).filter((f) => STUDENT_FIELDS.includes(f));
  if (fields.length === 0) {
    const existing = await getStudentById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [...fields.map((f) => updates[f] ?? null), id];

  const result = await query(`UPDATE students SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getStudentById(id);
}

async function getNextStudentCode() {
  const rows = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM students');
  const next = rows[0].next_id;
  return `STU-${String(next).padStart(3, '0')}`;
}

async function deleteStudent(id) {
  const result = await query('DELETE FROM students WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  ensureStudentForUser,
  createStudent,
  getNextStudentCode,
  updateStudent,
  deleteStudent,
};
