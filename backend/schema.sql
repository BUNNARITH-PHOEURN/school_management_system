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
  status ENUM('enrolled', 'dropped') NOT NULL DEFAULT 'enrolled',
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
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'moderator') NOT NULL DEFAULT 'moderator',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
