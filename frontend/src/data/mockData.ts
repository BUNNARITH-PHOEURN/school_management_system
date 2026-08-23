export type Status = 'active' | 'inactive'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'permission'
export type Role = 'admin' | 'moderator'
export type EnrollmentStatus = 'enrolled' | 'dropped' | 'completed'

export interface Department {
  id: number
  code: string
  name: string
  description: string
  status: Status
  createdAt: string
}

export interface AcademicYear {
  id: number
  name: string
  startDate: string
  endDate: string
  status: Status
}

export interface Student {
  id: number
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: number
  gender: 'male' | 'female'
  dateOfBirth: string
  address: string
  photo?: string
  status: Status
  enrolledAt: string
}

export interface Teacher {
  id: number
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: number
  gender: 'male' | 'female'
  specialization: string
  photo?: string
  status: Status
  joinedAt: string
}

export interface Subject {
  id: number
  code: string
  name: string
  credits: number
  description: string
  departmentId: number
  status: Status
}

export interface Class {
  id: number
  name: string
  academicYearId: number
  subjectId: number
  room: string
  day: string
  startTime: string
  endTime: string
  status: Status
  teacherIds: number[]
}

export interface Enrollment {
  id: number
  studentId: number
  classId: number
  enrolledAt: string
  status: EnrollmentStatus
}

export interface AttendanceRecord {
  id: number
  studentId: number
  classId: number
  date: string
  status: AttendanceStatus
  remarks: string
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: Status
  createdAt: string
  lastLogin: string
}

export const departments: Department[] = [
  { id: 1, code: 'MATH', name: 'Mathematics', description: 'Pure and applied mathematics courses', status: 'active', createdAt: '2023-08-01' },
  { id: 2, code: 'SCI', name: 'Science', description: 'Physics, Chemistry, and Biology', status: 'active', createdAt: '2023-08-01' },
  { id: 3, code: 'ENG', name: 'English', description: 'Language, literature, and communication', status: 'active', createdAt: '2023-08-01' },
  { id: 4, code: 'CS', name: 'Computer Science', description: 'Programming and information technology', status: 'active', createdAt: '2023-08-01' },
  { id: 5, code: 'SOC', name: 'Social Studies', description: 'History, geography, and civics', status: 'inactive', createdAt: '2023-08-01' },
]

export const academicYears: AcademicYear[] = [
  { id: 1, name: '2024–2025', startDate: '2024-08-01', endDate: '2025-05-31', status: 'inactive' },
  { id: 2, name: '2025–2026', startDate: '2025-08-01', endDate: '2026-05-31', status: 'active' },
]

export const students: Student[] = [
  { id: 1, code: 'STU-001', firstName: 'Amara', lastName: 'Osei', email: 'amara.osei@school.edu', phone: '+1 555-0101', departmentId: 1, gender: 'female', dateOfBirth: '2008-03-14', address: '12 Maple Street, Springfield', status: 'active', enrolledAt: '2023-08-15' },
  { id: 2, code: 'STU-002', firstName: 'Lucas', lastName: 'Ferreira', email: 'lucas.f@school.edu', phone: '+1 555-0102', departmentId: 4, gender: 'male', dateOfBirth: '2007-11-22', address: '45 Oak Avenue, Springfield', status: 'active', enrolledAt: '2023-08-15' },
  { id: 3, code: 'STU-003', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@school.edu', phone: '+1 555-0103', departmentId: 2, gender: 'female', dateOfBirth: '2008-06-08', address: '78 Pine Road, Springfield', status: 'active', enrolledAt: '2023-08-15' },
  { id: 4, code: 'STU-004', firstName: 'Marcus', lastName: 'Williams', email: 'marcus.w@school.edu', phone: '+1 555-0104', departmentId: 3, gender: 'male', dateOfBirth: '2007-09-30', address: '23 Elm Court, Springfield', status: 'active', enrolledAt: '2023-08-15' },
  { id: 5, code: 'STU-005', firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.t@school.edu', phone: '+1 555-0105', departmentId: 4, gender: 'female', dateOfBirth: '2008-01-17', address: '56 Cedar Lane, Springfield', status: 'active', enrolledAt: '2024-01-10' },
  { id: 6, code: 'STU-006', firstName: 'Elijah', lastName: 'Johnson', email: 'elijah.j@school.edu', phone: '+1 555-0106', departmentId: 1, gender: 'male', dateOfBirth: '2007-07-25', address: '91 Birch Boulevard, Springfield', status: 'inactive', enrolledAt: '2023-08-15' },
  { id: 7, code: 'STU-007', firstName: 'Sofia', lastName: 'Reyes', email: 'sofia.r@school.edu', phone: '+1 555-0107', departmentId: 2, gender: 'female', dateOfBirth: '2008-04-03', address: '34 Willow Way, Springfield', status: 'active', enrolledAt: '2024-01-10' },
  { id: 8, code: 'STU-008', firstName: 'Aiden', lastName: 'Park', email: 'aiden.p@school.edu', phone: '+1 555-0108', departmentId: 3, gender: 'male', dateOfBirth: '2007-12-19', address: '67 Poplar Place, Springfield', status: 'active', enrolledAt: '2023-08-15' },
]

export const teachers: Teacher[] = [
  { id: 1, code: 'TCH-001', firstName: 'Dr. Rachel', lastName: 'Morgan', email: 'r.morgan@school.edu', phone: '+1 555-0201', departmentId: 1, gender: 'female', specialization: 'Calculus & Algebra', status: 'active', joinedAt: '2020-09-01' },
  { id: 2, code: 'TCH-002', firstName: 'James', lastName: 'Okafor', email: 'j.okafor@school.edu', phone: '+1 555-0202', departmentId: 4, gender: 'male', specialization: 'Software Engineering', status: 'active', joinedAt: '2021-01-15' },
  { id: 3, code: 'TCH-003', firstName: 'Dr. Helen', lastName: 'Chow', email: 'h.chow@school.edu', phone: '+1 555-0203', departmentId: 2, gender: 'female', specialization: 'Chemistry & Biology', status: 'active', joinedAt: '2019-08-20' },
  { id: 4, code: 'TCH-004', firstName: 'Carlos', lastName: 'Mendez', email: 'c.mendez@school.edu', phone: '+1 555-0204', departmentId: 3, gender: 'male', specialization: 'Literature & Writing', status: 'active', joinedAt: '2022-09-01' },
  { id: 5, code: 'TCH-005', firstName: 'Fatima', lastName: 'Al-Hassan', email: 'f.alhassan@school.edu', phone: '+1 555-0205', departmentId: 1, gender: 'female', specialization: 'Statistics & Probability', status: 'active', joinedAt: '2021-08-15' },
  { id: 6, code: 'TCH-006', firstName: 'David', lastName: 'Nguyen', email: 'd.nguyen@school.edu', phone: '+1 555-0206', departmentId: 4, gender: 'male', specialization: 'Networks & Security', status: 'inactive', joinedAt: '2020-01-10' },
]

export const subjects: Subject[] = [
  { id: 1, code: 'MATH101', name: 'Algebra I', credits: 3, description: 'Fundamentals of algebra and linear equations', departmentId: 1, status: 'active' },
  { id: 2, code: 'MATH201', name: 'Calculus', credits: 4, description: 'Differential and integral calculus', departmentId: 1, status: 'active' },
  { id: 3, code: 'SCI101', name: 'General Chemistry', credits: 3, description: 'Introduction to chemical principles', departmentId: 2, status: 'active' },
  { id: 4, code: 'ENG101', name: 'English Composition', credits: 3, description: 'Academic writing and communication skills', departmentId: 3, status: 'active' },
  { id: 5, code: 'CS101', name: 'Intro to Programming', credits: 3, description: 'Foundations of programming using Python', departmentId: 4, status: 'active' },
  { id: 6, code: 'CS201', name: 'Data Structures', credits: 4, description: 'Arrays, linked lists, trees, graphs', departmentId: 4, status: 'active' },
  { id: 7, code: 'SCI201', name: 'Physics', credits: 4, description: 'Mechanics, thermodynamics, and electricity', departmentId: 2, status: 'inactive' },
]

export const classes: Class[] = [
  { id: 1, name: 'Algebra I — Section A', academicYearId: 2, subjectId: 1, room: 'Room 101', day: 'Monday / Wednesday', startTime: '08:00', endTime: '09:30', status: 'active', teacherIds: [1] },
  { id: 2, name: 'CS Intro — Section A', academicYearId: 2, subjectId: 5, room: 'Lab 201', day: 'Tuesday / Thursday', startTime: '10:00', endTime: '11:30', status: 'active', teacherIds: [2] },
  { id: 3, name: 'Chemistry — Section A', academicYearId: 2, subjectId: 3, room: 'Lab 103', day: 'Monday / Wednesday / Friday', startTime: '13:00', endTime: '14:00', status: 'active', teacherIds: [3] },
  { id: 4, name: 'English Comp — Section A', academicYearId: 2, subjectId: 4, room: 'Room 205', day: 'Tuesday / Thursday', startTime: '08:00', endTime: '09:30', status: 'active', teacherIds: [4] },
  { id: 5, name: 'Data Structures — Section A', academicYearId: 2, subjectId: 6, room: 'Lab 202', day: 'Monday / Wednesday', startTime: '14:00', endTime: '15:30', status: 'active', teacherIds: [2] },
  { id: 6, name: 'Calculus — Section A', academicYearId: 2, subjectId: 2, room: 'Room 108', day: 'Friday', startTime: '10:00', endTime: '12:00', status: 'inactive', teacherIds: [1, 5] },
]

export const enrollments: Enrollment[] = [
  { id: 1, studentId: 1, classId: 1, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 2, studentId: 2, classId: 2, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 3, studentId: 3, classId: 3, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 4, studentId: 4, classId: 4, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 5, studentId: 5, classId: 2, enrolledAt: '2025-08-12', status: 'enrolled' },
  { id: 6, studentId: 6, classId: 1, enrolledAt: '2025-08-10', status: 'dropped' },
  { id: 7, studentId: 7, classId: 3, enrolledAt: '2025-08-12', status: 'enrolled' },
  { id: 8, studentId: 8, classId: 4, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 9, studentId: 1, classId: 5, enrolledAt: '2025-08-10', status: 'enrolled' },
  { id: 10, studentId: 5, classId: 5, enrolledAt: '2025-08-12', status: 'enrolled' },
]

export const attendance: AttendanceRecord[] = [
  { id: 1, studentId: 1, classId: 2, date: '2026-08-11', status: 'present', remarks: '' },
  { id: 2, studentId: 2, classId: 2, date: '2026-08-11', status: 'present', remarks: '' },
  { id: 3, studentId: 5, classId: 2, date: '2026-08-11', status: 'late', remarks: 'Traffic' },
  { id: 4, studentId: 1, classId: 2, date: '2026-08-13', status: 'present', remarks: '' },
  { id: 5, studentId: 2, classId: 2, date: '2026-08-13', status: 'absent', remarks: '' },
  { id: 6, studentId: 5, classId: 2, date: '2026-08-13', status: 'present', remarks: '' },
  { id: 7, studentId: 3, classId: 3, date: '2026-08-11', status: 'present', remarks: '' },
  { id: 8, studentId: 7, classId: 3, date: '2026-08-11', status: 'permission', remarks: 'Medical appointment' },
]

export const users: User[] = [
  { id: 1, name: 'Alexandra Chen', email: 'admin@school.edu', role: 'admin', status: 'active', createdAt: '2023-01-01', lastLogin: '2026-08-16' },
  { id: 2, name: 'Benjamin Torres', email: 'b.torres@school.edu', role: 'moderator', status: 'active', createdAt: '2023-08-01', lastLogin: '2026-08-15' },
  { id: 3, name: 'Carmen Liu', email: 'c.liu@school.edu', role: 'moderator', status: 'active', createdAt: '2024-01-15', lastLogin: '2026-08-14' },
  { id: 4, name: 'Daniel Obi', email: 'd.obi@school.edu', role: 'moderator', status: 'inactive', createdAt: '2023-08-01', lastLogin: '2026-05-20' },
]

export const getDepartmentName = (id: number) => departments.find(d => d.id === id)?.name ?? '—'
export const getAcademicYearName = (id: number) => academicYears.find(a => a.id === id)?.name ?? '—'
export const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name ?? '—'
export const getStudentName = (id: number) => { const s = students.find(x => x.id === id); return s ? `${s.firstName} ${s.lastName}` : '—' }
export const getClassName = (id: number) => classes.find(c => c.id === id)?.name ?? '—'
export const getTeacherName = (id: number) => { const t = teachers.find(x => x.id === id); return t ? `${t.firstName} ${t.lastName}` : '—' }
