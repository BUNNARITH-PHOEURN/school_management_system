const { query } = require('../config/db');

const ACADEMIC_YEAR_FIELDS = [
  'name',
  'start_date',
  'end_date',
  'status'
];

async function getAllAcademicYears() {
  return query(
    `SELECT id, name, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status
     FROM academic_years ORDER BY id DESC`,
  );
}

async function getAcademicYearById(id) {
  const rows = await query(
    `SELECT id, name, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status
     FROM academic_years WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0];
}

async function createAcademicYear(academicYear) {
  const fields = ACADEMIC_YEAR_FIELDS.filter(
    (f) => academicYear[f] !== undefined
  );

  const placeholders = fields.map(() => '?').join(', ');
  const params = fields.map((f) => academicYear[f] ?? null);

  const result = await query(
    `INSERT INTO academic_years (${fields.join(', ')})
     VALUES (${placeholders})`,
    params
  );

  const id = result.insertId;

  if (academicYear.name === undefined) {
    const name = `AY-${String(id).padStart(3, '0')}`;

    await query(
      'UPDATE academic_years SET name = ? WHERE id = ?',
      [name, id]
    );
  }

  return getAcademicYearById(id);
}

async function updateAcademicYear(id, updates) {
  const fields = Object.keys(updates).filter(
    (f) => ACADEMIC_YEAR_FIELDS.includes(f)
  );

  if (fields.length === 0) {
    const existing = await getAcademicYearById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [
    ...fields.map((f) => updates[f] ?? null),
    id
  ];

  const result = await query(
    `UPDATE academic_years
     SET ${setClause}
     WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getAcademicYearById(id);
}

async function deleteAcademicYear(id) {
  const result = await query(
    'DELETE FROM academic_years WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getAllAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
};