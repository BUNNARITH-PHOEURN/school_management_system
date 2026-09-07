const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const adminRow = {
  id: 1,
  name: 'Admin User',
  email: 'admin@school.edu',
  role: 'admin',
  status: 'active',
  student_id: null,
};

const studentRow = {
  id: 2,
  name: 'Amara Osei',
  email: 'amara@school.edu',
  role: 'student',
  status: 'active',
  student_id: 42,
};

const enrollmentRow = {
  id: 1,
  student_id: 1,
  class_id: 2,
  enrolled_at: '2026-08-24',
  status: 'enrolled',
  student_code: 'STU-001',
  student_name: 'Amara Osei',
  class_name: 'CS Intro — Section A',
};

const adminHeader = { 'x-user-id': '1' };
const studentHeader = { 'x-user-id': '2' };

beforeEach(() => {
  query.mockReset();
});

describe('authentication guard', () => {
  test('returns 401 when no x-user-id header is sent', async () => {
    const res = await request(app).get('/api/enrollments');

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 401 for an unknown or inactive user', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/enrollments').set('x-user-id', '999');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/enrollments', () => {
  test('returns 200 and all enrollments with names', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : [enrollmentRow],
    );

    const res = await request(app).get('/api/enrollments').set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      student_name: 'Amara Osei',
      student_code: 'STU-001',
      class_name: 'CS Intro — Section A',
    });
  });
});

describe('POST /api/enrollments', () => {
  test('returns 201 and creates the enrollment', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) return [];
      if (sql.startsWith('INSERT')) return { insertId: 5 };
      return [{ ...enrollmentRow, id: 5, student_id: 3, class_id: 5 }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 3, class_id: 5 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 5, student_id: 3, class_id: 5 });
  });

  test('forces a student to enroll as themselves ignoring the body student_id', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [studentRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) return [];
      if (sql.startsWith('INSERT')) return { insertId: 7 };
      return [{ ...enrollmentRow, id: 7, student_id: 42, class_id: 5 }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set(studentHeader)
      .send({ student_id: 999, class_id: 5 });

    expect(res.status).toBe(201);
    expect(res.body.student_id).toBe(42);
  });

  test('returns 403 for a student account not linked to a student record', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [{ ...studentRow, student_id: null }] : [],
    );

    const res = await request(app)
      .post('/api/enrollments')
      .set(studentHeader)
      .send({ class_id: 5 });

    expect(res.status).toBe(403);
  });

  test('returns 400 when the student is already enrolled', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : [enrollmentRow],
    );

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Student is already enrolled in this class' });
  });

  test('re-enrolls a dropped student by flipping status back to enrolled', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) {
        return [{ ...enrollmentRow, id: 9, status: 'dropped' }];
      }
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, id: 9, status: 'enrolled' }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('enrolled');
  });

  test('returns 400 when ids are missing', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : [],
    );

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 1 });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/enrollments/:id', () => {
  test('returns 200 and updates the status', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, status: 'dropped' }];
    });

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(adminHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('dropped');
  });

  test('allows a student to update their own enrollment', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [studentRow];
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, student_id: 42, status: 'dropped' }];
    });

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(studentHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('dropped');
  });

  test('returns 403 when a student updates someone else enrollment', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(studentHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(403);
  });

  test('returns 400 for an invalid status', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : [],
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(adminHeader)
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
  });

  test('returns 404 when the enrollment does not exist', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
      return [];
    });

    const res = await request(app)
      .put('/api/enrollments/999')
      .set(adminHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/enrollments/:id', () => {
  test('returns 200 when the enrollment is deleted', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : { affectedRows: 1 },
    );

    const res = await request(app).delete('/api/enrollments/1').set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Enrollment deleted successfully' });
  });

  test('returns 403 when a student deletes someone else enrollment', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app).delete('/api/enrollments/1').set(studentHeader);

    expect(res.status).toBe(403);
  });

  test('returns 404 when the enrollment does not exist', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : { affectedRows: 0 },
    );

    const res = await request(app).delete('/api/enrollments/999').set(adminHeader);

    expect(res.status).toBe(404);
  });
});