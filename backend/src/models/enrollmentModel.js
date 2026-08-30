const { query } = require('../config/db');

const SELECT_WITH_NAMES = `
  SELECT e.*, s.code AS student_code, s.first_name, s.last_name,
         CONCAT(s.first_name, ' ', s.last_name) AS student_name,
         c.name AS class_name
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN classes c ON c.id = e.class_id
`;

async function getAllEnrollments() {
  return query(`${SELECT_WITH_NAMES} ORDER BY e.id DESC`);
}

async function getEnrollmentById(id) {
  const rows = await query(`${SELECT_WITH_NAMES} WHERE e.id = ? LIMIT 1`, [id]);
  return rows[0];
}

async function findEnrollment(studentId, classId) {
  const rows = await query(
    'SELECT * FROM enrollments WHERE student_id = ? AND class_id = ? LIMIT 1',
    [studentId, classId],
  );
  return rows[0];
}

async function createEnrollment(studentId, classId) {
  const result = await query(
    `INSERT INTO enrollments (student_id, class_id, enrolled_at, status)
     VALUES (?, ?, CURDATE(), ?)`,
    [studentId, classId, 'enrolled'],
  );
  return getEnrollmentById(result.insertId);
}

async function updateEnrollment(id, updates) {
  const fields = Object.keys(updates).filter((f) => ['status', 'enrolled_at'].includes(f));
  if (fields.length === 0) {
    const existing = await getEnrollmentById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [...fields.map((f) => updates[f]), id];

  const result = await query(`UPDATE enrollments SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getEnrollmentById(id);
}

async function deleteEnrollment(id) {
  const result = await query('DELETE FROM enrollments WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  findEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};