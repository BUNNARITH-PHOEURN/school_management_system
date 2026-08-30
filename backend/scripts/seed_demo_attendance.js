require('dotenv').config();

const mysql = require('mysql2/promise');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const dayKey = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const statusFor = (studentId, classId, dayIndex) => {
  const roll = ((studentId * 17 + classId * 31 + dayIndex * 97) % 100);
  if (roll < 82) return 'present';
  if (roll < 90) return 'late';
  if (roll < 96) return 'absent';
  return 'permission';
};

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
  });

  const recentDays = [];
  for (let o = -5; o <= 0; o++) recentDays.push(dayKey(o));

  const [classRows] = await connection.query('SELECT id FROM classes ORDER BY id LIMIT 6');
  const demoClassIds = classRows.map((r) => r.id);

  const [demoPairs] = await connection.query(
    'SELECT student_id, class_id FROM enrollments WHERE status = ? AND class_id IN (?)',
    ['enrolled', demoClassIds],
  );

  let added = 0;
  for (const [i, day] of recentDays.entries()) {
    for (const { student_id, class_id } of demoPairs) {
      const exists = await connection.query(
        'SELECT 1 FROM attendance WHERE student_id = ? AND class_id = ? AND date = ?',
        [student_id, class_id, day],
      );
      if (exists[0].length > 0) continue;
      const status = statusFor(student_id, class_id, i);
      const remarks = status === 'present' ? '' : pick(['', '', '', 'Traffic', 'Medical appointment', 'Family event']);
      await connection.query(
        'INSERT INTO attendance (student_id, class_id, date, status, remarks) VALUES (?, ?, ?, ?, ?)',
        [student_id, class_id, day, status, remarks],
      );
      added++;
    }
  }

  console.log(`Demo attendance added for ${recentDays.length} days (${recentDays[0]} .. ${recentDays[recentDays.length - 1]}): ${added} new record(s).`);
  const [[{ c }]] = await connection.query('SELECT COUNT(*) AS c FROM attendance');
  console.log(`Total attendance rows now: ${c}`);

  await connection.end();
}

main().catch((err) => {
  console.error('Demo seed failed:', err.message);
  process.exit(1);
});