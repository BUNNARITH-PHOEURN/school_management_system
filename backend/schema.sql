-- ============================================================
-- School Management System — full schema
-- Engine: InnoDB | Charset: utf8mb4
-- Safe to re-run (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Departments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY departments_code_unique (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Academic Years
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_years (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Students
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(50) NULL,
  department_id INT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  date_of_birth DATE NULL,
  address VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  enrolled_at DATE NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_students_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Teachers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(50) NULL,
  department_id INT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  specialization VARCHAR(255) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  joined_at DATE NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_teachers_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Subjects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  description TEXT NULL,
  department_id INT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  UNIQUE KEY subjects_code_unique (code),
  CONSTRAINT fk_subjects_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Classes  (a subject taught in a room/time slot per year)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  academic_year_id INT NULL,
  subject_id INT NULL,
  room VARCHAR(50) NULL,
  day VARCHAR(100) NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  CONSTRAINT fk_classes_academic_year
    FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_classes_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 7. Class Teachers  (M:N — a class can have several teachers)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_teachers (
  id INT NOT NULL AUTO_INCREMENT,
  class_id INT NOT NULL,
  teacher_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY class_teacher_unique (class_id, teacher_id),
  CONSTRAINT fk_class_teachers_class
    FOREIGN KEY (class_id) REFERENCES classes (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_class_teachers_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8. Enrollments  (student <-> class)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  enrolled_at DATE NULL,
  status ENUM('pending', 'approved', 'rejected', 'dropped') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  notes TEXT NULL,
  docs_declared TINYINT(1) NOT NULL DEFAULT 0,
  doc_grade12 TINYINT(1) NOT NULL DEFAULT 0,
  doc_transcript TINYINT(1) NOT NULL DEFAULT 0,
  doc_idcopy TINYINT(1) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(50) NULL,
  payment_reference VARCHAR(100) NULL,
  paid_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY enrollment_unique (student_id, class_id),
  CONSTRAINT fk_enrollments_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_class
    FOREIGN KEY (class_id) REFERENCES classes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 8b. Subject Fees  (fee per subject per academic year)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subject_fees (
  id INT NOT NULL AUTO_INCREMENT,
  subject_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  UNIQUE KEY subject_fee_unique (subject_id, academic_year_id),
  CONSTRAINT fk_subject_fees_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_subject_fees_year
    FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 9. Attendance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'permission') NOT NULL DEFAULT 'present',
  remarks VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY attendance_unique (student_id, class_id, date),
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attendance_class
    FOREIGN KEY (class_id) REFERENCES classes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 10. Users  (admin / moderator accounts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) NULL,
  bio TEXT NULL,
  avatar_url MEDIUMTEXT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'moderator', 'teacher', 'student') NOT NULL DEFAULT 'student',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  teacher_id INT NULL,
  student_id INT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_teacher_id (teacher_id),
  KEY users_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Idempotent migration for existing databases: add student_id to users
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'student_id'
);
SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN student_id INT NULL AFTER teacher_id, ADD KEY users_student_id (student_id)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Idempotent migration for users: widen role enum to include 'teacher'
SET @role_ok = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role'
    AND COLUMN_TYPE LIKE '%teacher%'
);
SET @ddl = IF(
  @role_ok = 0,
  "ALTER TABLE users MODIFY COLUMN role ENUM('admin','moderator','teacher','student') NOT NULL DEFAULT 'student'",
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Idempotent migration for enrollments:
-- 1) widen the status enum to include pending/rejected,
-- 2) migrate existing 'enrolled' rows -> 'approved',
-- 3) add review audit columns when missing.
SET @enum_ok = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enrollments'
    AND COLUMN_NAME = 'status'
    AND COLUMN_TYPE LIKE '%pending%'
    AND COLUMN_TYPE LIKE '%rejected%'
);
SET @ddl = IF(
  @enum_ok = 0,
  "ALTER TABLE enrollments
     MODIFY COLUMN status ENUM('pending','approved','rejected','dropped') NOT NULL DEFAULT 'pending',
     MODIFY COLUMN enrolled_at DATE NULL",
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Idempotent migration for enrollments: add document, fee and payment columns
SET @doc_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'doc_grade12'
);
SET @ddl = IF(
  @doc_exists = 0,
  "ALTER TABLE enrollments
     ADD COLUMN notes TEXT NULL AFTER reviewed_at,
     ADD COLUMN docs_declared TINYINT(1) NOT NULL DEFAULT 0 AFTER notes,
     ADD COLUMN doc_grade12 TINYINT(1) NOT NULL DEFAULT 0 AFTER docs_declared,
     ADD COLUMN doc_transcript TINYINT(1) NOT NULL DEFAULT 0 AFTER doc_grade12,
     ADD COLUMN doc_idcopy TINYINT(1) NOT NULL DEFAULT 0 AFTER doc_transcript,
     ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER doc_idcopy,
     ADD COLUMN payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid' AFTER amount,
     ADD COLUMN payment_method VARCHAR(50) NULL AFTER payment_status,
     ADD COLUMN payment_reference VARCHAR(100) NULL AFTER payment_method,
     ADD COLUMN paid_at DATETIME NULL AFTER payment_reference",
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE enrollments SET status = 'approved' WHERE status = 'enrolled';

SET @rb_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'reviewed_by'
);
SET @ddl = IF(
  @rb_exists = 0,
  'ALTER TABLE enrollments ADD COLUMN reviewed_by INT NULL AFTER status, ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Idempotent: ensure subject_fees table exists for existing databases
CREATE TABLE IF NOT EXISTS subject_fees (
  id INT NOT NULL AUTO_INCREMENT,
  subject_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  UNIQUE KEY subject_fee_unique (subject_id, academic_year_id),
  CONSTRAINT fk_subject_fees_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_subject_fees_year
    FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;