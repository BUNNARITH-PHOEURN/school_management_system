const { query } = require('../config/db');

async function list() {
  return query(`
    SELECT ct.class_id, ct.teacher_id,
      c.name AS class_name,
      t.code AS teacher_code,
      t.first_name,
      t.last_name,
      t.specialization,
      t.status AS teacher_status
    FROM class_teachers ct
    JOIN classes c ON c.id = ct.class_id
    JOIN teachers t ON t.id = ct.teacher_id
    ORDER BY c.name, t.last_name, t.first_name
  `);
}

async function create(classId, teacherId) {
  await query(
    'INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)',
    [classId, teacherId],
  );
  return { class_id: classId, teacher_id: teacherId };
}

async function remove(classId, teacherId) {
  const result = await query(
    'DELETE FROM class_teachers WHERE class_id = ? AND teacher_id = ?',
    [classId, teacherId],
  );
  return result.affectedRows > 0;
}

module.exports = { list, create, remove };
