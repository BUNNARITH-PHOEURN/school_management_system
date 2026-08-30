const { query } = require('../config/db');

const SELECT_WITH_NAMES = `
  SELECT a.*, s.code AS student_code, s.first_name, s.last_name,
         CONCAT(s.first_name, ' ', s.last_name) AS student_name,
         c.name AS class_name
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN classes c ON c.id = a.class_id
`;

async function getAttendance(filters = {}) {
  const where = [];
  const params = [];

  if (filters.classId) {
    where.push('a.class_id = ?');
    params.push(filters.classId);
  }
  if (filters.date) {
    where.push('a.date = ?');
    params.push(filters.date);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return query(`${SELECT_WITH_NAMES} ${whereClause} ORDER BY a.date DESC, a.id DESC`, params);
}

async function getAttendanceById(id) {
  const rows = await query(`${SELECT_WITH_NAMES} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0];
}

async function findAttendance(studentId, classId, date) {
  const rows = await query(
    'SELECT * FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? LIMIT 1',
    [studentId, classId, date],
  );
  return rows[0];
}

async function createAttendance(record) {
  await query(
    `INSERT INTO attendance (student_id, class_id, date, status, remarks)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
    [record.student_id, record.class_id, record.date, record.status, record.remarks ?? null],
  );
  return findAttendance(record.student_id, record.class_id, record.date);
}

async function saveBatch(records) {
  if (records.length === 0) return;

  const values = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
  const params = [];
  for (const r of records) {
    params.push(r.student_id, r.class_id, r.date, r.status, r.remarks ?? null);
  }

  await query(
    `INSERT INTO attendance (student_id, class_id, date, status, remarks)
     VALUES ${values}
     ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
    params,
  );
}

async function updateAttendance(id, updates) {
  const fields = Object.keys(updates).filter((f) => ['status', 'remarks'].includes(f));
  if (fields.length === 0) {
    const existing = await getAttendanceById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [...fields.map((f) => updates[f]), id];

  const result = await query(`UPDATE attendance SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getAttendanceById(id);
}

async function deleteAttendance(id) {
  const result = await query('DELETE FROM attendance WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAttendance,
  getAttendanceById,
  findAttendance,
  createAttendance,
  saveBatch,
  updateAttendance,
  deleteAttendance,
};