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

async function getAllEnrollments(options = {}) {
  const limit = options.limit ?? null;
  const offset = options.offset ?? 0;
  const limitClause = limit ? ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : '';
  const { where, params } = buildFilters(options);
  return query(`${SELECT_WITH_NAMES} ${where} GROUP BY e.id ORDER BY e.id DESC${limitClause}`, params);
}

function buildFilters(options = {}) {
  const where = [];
  const params = [];
  if (options.status && options.status !== 'all') {
    where.push('e.status = ?');
    params.push(options.status);
  }
  if (options.payment_status && options.payment_status !== 'all') {
    where.push('e.payment_status = ?');
    params.push(options.payment_status);
  }
  if (options.class_id && options.class_id !== 'all') {
    where.push('e.class_id = ?');
    params.push(options.class_id);
  }
  if (options.search) {
    where.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.code LIKE ? OR c.name LIKE ?)');
    const like = `%${options.search}%`;
    params.push(like, like, like, like);
  }
  return { where: where.length ? ` WHERE ${where.join(' AND ')}` : '', params };
}

async function countEnrollments(options = {}) {
  const { where, params } = buildFilters(options);
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     JOIN classes c ON c.id = e.class_id
     ${where}`,
    params,
  );
  return Number(rows[0]?.total ?? 0);
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

async function createEnrollment(studentId, classId, details = {}) {
  const result = await query(
    `INSERT INTO enrollments
       (student_id, class_id, enrolled_at, status, reviewed_by, reviewed_at,
        notes, docs_declared, amount)
     VALUES (?, ?, CURDATE(), 'pending', NULL, NULL, ?, ?, ?)`,
    [
      studentId,
      classId,
      details.notes ?? null,
      details.docs_declared ? 1 : 0,
      details.amount ?? 0,
    ],
  );
  return getEnrollmentById(result.insertId);
}

async function resetToPending(id) {
  return query(
    `UPDATE enrollments
     SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL,
         notes = NULL, docs_declared = 0,
         doc_grade12 = 0, doc_transcript = 0, doc_idcopy = 0,
         payment_status = 'unpaid', payment_method = NULL,
         payment_reference = NULL, paid_at = NULL
     WHERE id = ?`,
    [id],
  );
}

async function updateEnrollment(id, updates) {
  const fields = Object.keys(updates).filter((f) =>
    [
      'status', 'enrolled_at', 'reviewed_by', 'reviewed_at',
      'notes', 'docs_declared', 'doc_grade12', 'doc_transcript', 'doc_idcopy',
      'amount', 'payment_status', 'payment_method', 'payment_reference', 'paid_at',
    ].includes(f),
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

async function markPaid(id, method, reference) {
  const result = await query(
    `UPDATE enrollments
     SET payment_status = 'paid', payment_method = ?, payment_reference = ?, paid_at = NOW()
     WHERE id = ?`,
    [method ?? null, reference ?? null, id],
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
  countEnrollments,
  getEnrollmentById,
  findEnrollment,
  createEnrollment,
  resetToPending,
  updateEnrollment,
  review,
  markPaid,
  deleteEnrollment,
};
