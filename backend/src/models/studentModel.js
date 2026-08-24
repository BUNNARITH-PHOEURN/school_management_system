const { query } = require('../config/db');

async function getAllStudents() {
  return query('SELECT * FROM students ORDER BY id DESC');
}

async function getStudentById(id) {
  const rows = await query('SELECT * FROM students WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function createStudent(student) {
  const result = await query(
    'INSERT INTO students (first_name, last_name, email, date_of_birth, gender) VALUES (?, ?, ?, ?, ?)',
    [
      student.first_name,
      student.last_name,
      student.email,
      student.date_of_birth || null,
      student.gender || null,
    ],
  );
  return getStudentById(result.insertId);
}

async function updateStudent(id, student) {
  const result = await query(
    'UPDATE students SET first_name = ?, last_name = ?, email = ?, date_of_birth = ?, gender = ? WHERE id = ?',
    [
      student.first_name,
      student.last_name,
      student.email,
      student.date_of_birth || null,
      student.gender || null,
      id,
    ],
  );
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
