const { query } = require('../config/db');

async function listFees(options = {}) {
  const limit = options.limit ?? null;
  const offset = options.offset ?? 0;
  const limitClause = limit ? ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : '';
  return query(`
    SELECT sf.id, sf.subject_id, sf.academic_year_id, sf.fee,
           s.code AS subject_code, s.name AS subject_name,
           ay.name AS academic_year_name
    FROM subject_fees sf
    JOIN subjects s ON s.id = sf.subject_id
    JOIN academic_years ay ON ay.id = sf.academic_year_id
    ORDER BY s.name, ay.name${limitClause}
  `);
}

async function countFees() {
  const rows = await query('SELECT COUNT(*) AS total FROM subject_fees');
  return Number(rows[0]?.total ?? 0);
}

async function getFee(subjectId, academicYearId) {
  const rows = await query(
    'SELECT * FROM subject_fees WHERE subject_id = ? AND academic_year_id = ? LIMIT 1',
    [subjectId, academicYearId],
  );
  return rows[0];
}

async function upsertFee(subjectId, academicYearId, fee) {
  const amount = Number(fee);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('fee must be a non-negative number');
  }
  const existing = await getFee(subjectId, academicYearId);
  if (existing) {
    await query(
      'UPDATE subject_fees SET fee = ? WHERE subject_id = ? AND academic_year_id = ?',
      [amount, subjectId, academicYearId],
    );
  } else {
    await query(
      'INSERT INTO subject_fees (subject_id, academic_year_id, fee) VALUES (?, ?, ?)',
      [subjectId, academicYearId, amount],
    );
  }
  return getFee(subjectId, academicYearId);
}

async function deleteFee(id) {
  const result = await query('DELETE FROM subject_fees WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listFees,
  countFees,
  getFee,
  upsertFee,
  deleteFee,
};