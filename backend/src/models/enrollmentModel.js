const { query } = require('../config/db');

const SELECT_WITH_NAMES = `
  SELECT e.*, s.code AS student_code, s.first_name, s.last_name,
         CONCAT(s.first_name, ' ', s.last_name) AS student_name,
         c.name AS class_name,
         subj.code AS subject_code,
         subj.name AS subject_name,
         COALESCE(GROUP_CONCAT(DISTINCT CONCAT(t.first_name, ' ', t.last_name) ORDER BY t.last_name, t.first_name SEPARATOR ', '), '') AS teacher_names,
         r.name AS reviewed_by_name
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN classes c ON c.id = e.class_id
  LEFT JOIN subjects subj ON subj.id = c.subject_id
  LEFT JOIN class_teachers ct ON ct.class_id = c.id
  LEFT JOIN teachers t ON t.id = ct.teacher_id
  LEFT JOIN users r ON r.id = e.reviewed_by
`;

async function getAllEnrollments() {
  return query(`${SELECT_WITH_NAMES} GROUP BY e.id ORDER BY e.id DESC`);
}

async function getEnrollmentById(id) {
  const rows = await query(
    `${SELECT_WITH_NAMES} WHERE e.id = ? GROUP BY e.id LIMIT 1`,
    [id],
  );
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
    `INSERT INTO enrollments (student_id, class_id, enrolled_at, status, reviewed_by, reviewed_at)
     VALUES (?, ?, CURDATE(), 'pending', NULL, NULL)`,
    [studentId, classId],
  );
  return getEnrollmentById(result.insertId);
}

async function resetToPending(id) {
  return query(
    `UPDATE enrollments SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL
     WHERE id = ?`,
    [id],
  );
}

async function updateEnrollment(id, updates) {
  const fields = Object.keys(updates).filter((f) =>
    ['status', 'enrolled_at', 'reviewed_by', 'reviewed_at'].includes(f),
  );
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

async function review(id, status, reviewerId) {
  const result = await query(
    `UPDATE enrollments
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, reviewerId, id],
  );
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
  resetToPending,
  updateEnrollment,
  review,
  deleteEnrollment,
};
