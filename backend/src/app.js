const express = require('express');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const subjectFeeRoutes = require('./routes/subjectFeeRoutes');
const teacherAssignmentRoutes = require('./routes/teacherAssignmentRoutes');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academicYears', academicYearRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/subject-fees', subjectFeeRoutes);
app.use('/api/teacher-assignments', teacherAssignmentRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
