const { pool, query } = require('../config/db');

const CLASS_FIELDS = [
  'name',
  'academic_year_id',
  'subject_id',
  'room',
  'day',
  'start_time',
  'end_time',
  'status',
];

async function getAllClasses() {
  return query(`
    SELECT c.*,
      COALESCE(GROUP_CONCAT(ct.teacher_id ORDER BY ct.teacher_id), '') AS teacher_ids
    FROM classes c
    LEFT JOIN class_teachers ct ON ct.class_id = c.id
    GROUP BY c.id
    ORDER BY c.id
  `);
}

async function getClassById(id) {
  const rows = await query(`
    SELECT c.*,
      COALESCE(GROUP_CONCAT(ct.teacher_id ORDER BY ct.teacher_id), '') AS teacher_ids
    FROM classes c
    LEFT JOIN class_teachers ct ON ct.class_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
    LIMIT 1
  `, [id]);
  return rows[0];
}

async function getClassesByTeacher(teacherId) {
  return query(
    'SELECT c.* FROM classes c JOIN class_teachers ct ON ct.class_id = c.id WHERE ct.teacher_id = ? ORDER BY c.id',
    [teacherId],
  );
}

async function createClass(cls) {
  const fields = CLASS_FIELDS.filter((f) => cls[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const params = fields.map((f) => cls[f] ?? null);

  const result = await query(
    `INSERT INTO classes (${fields.join(', ')}) VALUES (${placeholders})`,
    params,
  );

  return getClassById(result.insertId);
}

async function updateClass(id, updates) {
  const fields = Object.keys(updates).filter((f) => CLASS_FIELDS.includes(f));
  if (fields.length === 0) {
    const existing = await getClassById(id);
    return existing ?? null;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const params = [...fields.map((f) => updates[f] ?? null), id];

  const result = await query(`UPDATE classes SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) return null;
  return getClassById(id);
}

async function deleteClass(id) {
  const result = await query('DELETE FROM classes WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function replaceTeacherAssignments(classId, teacherIds) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM class_teachers WHERE class_id = ?', [classId]);
    for (const teacherId of teacherIds) {
      await conn.query(
        'INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)',
        [classId, teacherId],
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  getAllClasses,
  getClassById,
  getClassesByTeacher,
  createClass,
  updateClass,
  deleteClass,
  replaceTeacherAssignments,
};