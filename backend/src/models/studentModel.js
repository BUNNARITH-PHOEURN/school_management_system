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
  return query('SELECT * FROM students ORDER BY id DESC');
}

async function getStudentById(id) {
  const rows = await query('SELECT * FROM students WHERE id = ? LIMIT 1', [id]);
  return rows[0];
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

async function deleteStudent(id) {
  const result = await query('DELETE FROM students WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
