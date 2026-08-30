require('dotenv').config();

const mysql = require('mysql2/promise');

// deterministic pseudo-random so every run seeds identical data
let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));

const FIRST_NAMES = [
  'Amara', 'Lucas', 'Priya', 'Marcus', 'Yuki', 'Elijah', 'Sofia', 'Aiden',
  'Nadia', 'Omar', 'Isabella', 'Chen', 'Fatima', 'Diego', 'Hannah', 'Kwame',
  'Ingrid', 'Rajesh', 'Mei', 'Carlos', 'Zara', 'Tomas', 'Leila', 'Ivan',
  'Aisha', 'Pedro', 'Anika', 'Jamal', 'Elena', 'Hiroshi', 'Carmen', 'Femi',
  'Greta', 'Arjun', 'Lucia', 'Dmitri', 'Amina', 'Marco', 'Yasmin', 'Kenji',
  'Rosa', 'Tariq', 'Freya', 'Sanjay', 'Bianca', 'Kofi', 'Marta', 'Ali',
  'Noor', 'Stefan', 'Divya', 'Andres', 'Keiko', 'Samir', 'Clara', 'Obi',
  'Astrid', 'Rohan', 'Paloma', 'Jin',
];
const LAST_NAMES = [
  'Osei', 'Ferreira', 'Sharma', 'Williams', 'Tanaka', 'Johnson', 'Reyes', 'Park',
  'Hassan', 'Farouk', 'Rossi', 'Wei', 'Al-Hassan', 'Morales', 'Kim', 'Mensah',
  'Larsen', 'Patel', 'Nguyen', 'Silva', 'Khan', 'Novak', 'Haddad', 'Petrov',
  'Okafor', 'Garcia', 'Sato', 'Ibrahim', 'Vargas', 'Yamada', 'Lopez', 'Adeyemi',
  'Schmidt', 'Mehta', 'Costa', 'Smirnov', 'Diallo', 'Bianchi', 'Aziz', 'Watanabe',
  'Ortega', 'Chowdhury', 'Berg', 'Kumar', 'Moretti', 'Boateng', 'Kowalski', 'Rahman',
  'Ahmed', 'Horvat', 'Iyer', 'Hernandez', 'Tan', 'Aliyev', 'Fontaine', 'Nwosu',
  'Nilsson', 'Kapoor', 'Delgado', 'Park-sa',
];
const STREETS = [
  'Maple Street', 'Oak Avenue', 'Pine Road', 'Elm Court', 'Cedar Lane',
  'Birch Boulevard', 'Willow Way', 'Poplar Place', 'Spruce Drive', 'Aspen Circle',
];
const SPECIALIZATIONS = {
  1: ['Calculus & Algebra', 'Geometry', 'Statistics & Probability'],
  2: ['Physics', 'Chemistry', 'Biology'],
  3: ['Literature & Writing', 'Linguistics', 'Communication'],
  4: ['Software Engineering', 'Networks & Security', 'Data Structures', 'Databases'],
  5: ['World History', 'Geography', 'Civics & Economics'],
  6: ['Drawing & Painting', 'Digital Art', 'Art History'],
  7: ['Athletics', 'Team Sports', 'Health Science'],
  8: ['Music Theory', 'Instrumental', 'Vocal Performance'],
};
const DAYS = ['Monday / Wednesday', 'Tuesday / Thursday', 'Monday / Wednesday / Friday', 'Friday'];
const TIME_SLOTS = [
  ['08:00', '09:30'], ['10:00', '11:30'], ['13:00', '14:30'], ['14:00', '15:30'], ['08:00', '12:00'],
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    multipleStatements: true,
  });

  // ---- clean slate ------------------------------------------------------
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await connection.query('SHOW TABLES');
  for (const row of tables) {
    const table = Object.values(row)[0];
    if (table === 'student') continue; // legacy leftover, untouched
    await connection.query(`TRUNCATE TABLE \`${table}\``);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Existing data cleared.');

  // ---- departments (lookup table) ---------------------------------------
  const departments = [
    ['MATH', 'Mathematics', 'Pure and applied mathematics courses'],
    ['SCI', 'Science', 'Physics, Chemistry, and Biology'],
    ['ENG', 'English', 'Language, literature, and communication'],
    ['CS', 'Computer Science', 'Programming and information technology'],
    ['SOC', 'Social Studies', 'History, geography, and civics'],
    ['ART', 'Arts', 'Visual arts and design'],
    ['PE', 'Physical Education', 'Sports and health science'],
    ['MUS', 'Music', 'Instrumental and vocal music programs'],
  ];
  for (const [code, name, description] of departments) {
    await connection.query(
      'INSERT INTO departments (code, name, description, status) VALUES (?, ?, ?, ?)',
      [code, name, description, code === 'SOC' ? 'inactive' : 'active'],
    );
  }

  // ---- academic years (lookup table) ------------------------------------
  for (const [name, start, end, status] of [
    ['2023–2024', '2023-08-01', '2024-05-31', 'inactive'],
    ['2024–2025', '2024-08-01', '2025-05-31', 'inactive'],
    ['2025–2026', '2025-08-01', '2026-05-31', 'active'],
  ]) {
    await connection.query(
      'INSERT INTO academic_years (name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
      [name, start, end, status],
    );
  }

  // ---- students (60) ------------------------------------------------------
  const usedEmails = new Set();
  for (let i = 1; i <= 60; i++) {
    const first = pick(FIRST_NAMES);
    let last = pick(LAST_NAMES);
    let email = `${first}.${last}@school.edu`.toLowerCase().replace(/[^a-z0-9.@-]/g, '');
    while (usedEmails.has(email)) {
      last = pick(LAST_NAMES);
      email = `${first}.${last}${randInt(2, 99)}@school.edu`.toLowerCase().replace(/[^a-z0-9.@-]/g, '');
    }
    usedEmails.add(email);

    const gender = rand() < 0.47 ? 'male' : rand() < 0.94 ? 'female' : 'other';
    const dob = `200${randInt(7, 9)}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`;
    const status = rand() < 0.88 ? 'active' : 'inactive';
    const enrolledAt = rand() < 0.75 ? '2025-08-15' : '2025-01-12';

    await connection.query(
      `INSERT INTO students (code, first_name, last_name, email, phone, department_id, gender, date_of_birth, address, status, enrolled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `STU-${String(i).padStart(3, '0')}`,
        first,
        last,
        email,
        `+1 555-${String(1000 + i).slice(1)}`,
        randInt(1, 8),
        gender,
        dob,
        `${randInt(1, 150)} ${pick(STREETS)}, Springfield`,
        status,
        enrolledAt,
      ],
    );
  }

  // ---- teachers (24) ------------------------------------------------------
  const teacherIds = [];
  for (let i = 1; i <= 24; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    let email = `${first[0]}.${last}@school.edu`.toLowerCase().replace(/[^a-z0-9.@-]/g, '');
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${first[0]}.${last}${suffix++}@school.edu`.toLowerCase().replace(/[^a-z0-9.@-]/g, '');
    }
    usedEmails.add(email);

    const deptId = ((i - 1) % 8) + 1;
    const [result] = await connection.query(
      `INSERT INTO teachers (code, first_name, last_name, email, phone, department_id, gender, specialization, status, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `TCH-${String(i).padStart(3, '0')}`,
        first,
        last,
        email,
        `+1 555-${String(2000 + i).slice(1)}`,
        deptId,
        rand() < 0.5 ? 'male' : 'female',
        pick(SPECIALIZATIONS[deptId]),
        i === 12 ? 'inactive' : 'active',
        `20${randInt(18, 24)}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`,
      ],
    );
    if (i !== 12) teacherIds.push(result.insertId);
  }

  // ---- subjects (16) ------------------------------------------------------
  const subjectPlan = [
    ['ALG101', 'Algebra I', 1], ['CAL201', 'Calculus', 1], ['STA301', 'Statistics', 1],
    ['PHY101', 'General Physics', 2], ['CHM101', 'General Chemistry', 2], ['BIO101', 'Biology', 2],
    ['ENG101', 'English Composition', 3], ['LIT201', 'World Literature', 3],
    ['CS101', 'Intro to Programming', 4], ['CS201', 'Data Structures', 4], ['CS301', 'Databases', 4],
    ['HIS101', 'World History', 5], ['GEO101', 'Geography', 5],
    ['ART101', 'Drawing & Painting', 6],
    ['PED101', 'Physical Education', 7],
    ['MUS101', 'Music Theory', 8],
  ];
  const subjectIds = [];
  for (const [code, name, deptId, ] of subjectPlan) {
    const [r] = await connection.query(
      'INSERT INTO subjects (code, name, credits, description, department_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, randInt(2, 4), `${name} core course`, deptId, code === 'STA301' ? 'inactive' : 'active'],
    );
    subjectIds.push({ id: r.insertId, name, deptId });
  }

  // ---- classes (36) -------------------------------------------------------
  const classRows = [];
  for (let i = 1; i <= 36; i++) {
    const subject = pick(subjectIds.filter((s) => s.id !== 7)); // skip inactive Statistics
    const section = pick(['A', 'B', 'C']);
    const [start, end] = pick(TIME_SLOTS);
    const [r] = await connection.query(
      `INSERT INTO classes (name, academic_year_id, subject_id, room, day, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${subject.name} — Section ${section}`,
        rand() < 0.85 ? 3 : 2,
        subject.id,
        subject.deptId === 2 || subject.deptId === 4 ? `Lab ${randInt(101, 203)}` : `Room ${randInt(101, 305)}`,
        pick(DAYS),
        start,
        end,
        rand() < 0.9 ? 'active' : 'inactive',
      ],
    );
    classRows.push(r.insertId);
  }

  // ---- class_teachers (each class gets 1–2 teachers) ---------------------
  for (const classId of classRows) {
    const count = rand() < 0.75 ? 1 : 2;
    const chosen = new Set();
    for (let k = 0; k < count; k++) chosen.add(pick(teacherIds));
    for (const teacherId of chosen) {
      await connection.query(
        'INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)',
        [classId, teacherId],
      );
    }
  }

  // ---- enrollments (every student into 3–4 classes) ----------------------
  const enrollmentPairs = [];
  for (let studentId = 1; studentId <= 60; studentId++) {
    const nClasses = randInt(3, 4);
    const picked = new Set();
    while (picked.size < nClasses) picked.add(pick(classRows));
    for (const classId of picked) {
      const status = rand() < 0.93 ? 'enrolled' : 'dropped';
      await connection.query(
        'INSERT INTO enrollments (student_id, class_id, enrolled_at, status) VALUES (?, ?, ?, ?)',
        [studentId, classId, rand() < 0.8 ? '2025-08-10' : '2025-08-12', status],
      );
      if (status === 'enrolled') enrollmentPairs.push([studentId, classId]);
    }
  }

  // ---- attendance (school days over two weeks) ---------------------------
  const schoolDays = [
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
  ];
  const REMARKS = ['', '', '', '', '', '', 'Traffic', 'Medical appointment', 'Family event'];
  for (const [studentId, classId] of enrollmentPairs.slice(0, 45)) {
    for (const day of schoolDays) {
      if (rand() < 0.15) continue; // not every student attends every session
      const roll = rand();
      const status = roll < 0.82 ? 'present' : roll < 0.9 ? 'late' : roll < 0.96 ? 'absent' : 'permission';
      await connection.query(
        'INSERT INTO attendance (student_id, class_id, date, status, remarks) VALUES (?, ?, ?, ?, ?)',
        [studentId, classId, day, status, status === 'present' ? '' : pick(REMARKS)],
      );
    }
  }

  // ---- users --------------------------------------------------------------
  for (const [name, email, role, lastLogin] of [
    ['Alexandra Chen', 'admin@school.edu', 'admin', '2026-08-23 09:12:00'],
    ['Benjamin Torres', 'b.torres@school.edu', 'moderator', '2026-08-22 14:40:00'],
    ['Carmen Liu', 'c.liu@school.edu', 'moderator', '2026-08-21 11:05:00'],
    ['Daniel Obi', 'd.obi@school.edu', 'moderator', '2026-06-20 16:30:00'],
    ['Esra Yilmaz', 'e.yilmaz@school.edu', 'moderator', '2026-08-19 08:22:00'],
    ['Frank Muller', 'f.muller@school.edu', 'moderator', null],
  ]) {
    await connection.query(
      'INSERT INTO users (name, email, role, status, last_login) VALUES (?, ?, ?, ?, ?)',
      [name, email, role, name === 'Daniel Obi' ? 'inactive' : 'active', lastLogin],
    );
  }

  // ---- report --------------------------------------------------------------
  const countTables = [
    'departments', 'academic_years', 'students', 'teachers', 'subjects',
    'classes', 'class_teachers', 'enrollments', 'attendance', 'users',
  ];
  console.log('\nSeed complete. Row counts:');
  for (const t of countTables) {
    const [[{ c }]] = await connection.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    console.log(`  ${t.padEnd(16)} ${c}`);
  }

  await connection.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
