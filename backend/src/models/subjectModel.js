const { query } = require('../config/db');

async function getAllSubjects() {
  return query(
    'SELECT id, code, name, credits, description, department_id, status FROM subjects ORDER BY name',
  );
}

module.exports = { getAllSubjects };
