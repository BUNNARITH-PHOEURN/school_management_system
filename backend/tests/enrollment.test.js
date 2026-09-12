const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');
const { authHeader } = require('./authTestUtils');

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
  status: 'approved',
  reviewed_by: null,
  reviewed_at: null,
  notes: null,
  docs_declared: 1,
  doc_grade12: 1,
  doc_transcript: 1,
  doc_idcopy: 1,
  amount: 120,
  payment_status: 'unpaid',
  payment_method: null,
  payment_reference: null,
  paid_at: null,
  student_code: 'STU-001',
  student_name: 'Amara Osei',
  class_name: 'CS Intro — Section A',
  subject_code: 'CS101',
  subject_name: 'Intro to CS',
  teacher_names: 'Kofi Mensah',
  reviewed_by_name: null,
};

const adminHeader = authHeader(1, 'admin');
const studentHeader = authHeader(2, 'student');

beforeEach(() => {
  query.mockReset();
});

// Helper: the auth middleware looks up the user via "FROM users"; other lookups
// are enrollment logic. We route based on the SQL text.
function mockAuth(userRow) {
  query.mockImplementation(async (sql) =>
    String(sql).includes('FROM users') ? [userRow] : [],
  );
}

describe('authentication guard', () => {
  test('returns 401 when no token is sent', async () => {
    const res = await request(app).get('/api/enrollments');

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 401 for an unknown or inactive user', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/enrollments').set(adminHeader);

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
      subject_name: 'Intro to CS',
      teacher_names: 'Kofi Mensah',
    });
  });
});

describe('POST /api/enrollments', () => {
  test('returns 201 and creates the enrollment as pending', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) return [];
      if (sql.startsWith('INSERT')) return { insertId: 5 };
      return [{ ...enrollmentRow, id: 5, student_id: 3, class_id: 5, status: 'pending' }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 3, class_id: 5 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 5, student_id: 3, class_id: 5, status: 'pending' });
  });

  test('forces a student to enroll as themselves ignoring the body student_id', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [studentRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) return [];
      if (sql.startsWith('INSERT')) return { insertId: 7 };
      return [{ ...enrollmentRow, id: 7, student_id: 42, class_id: 5, status: 'pending' }];
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

  test('returns 409 when a request is already pending', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users')
        ? [adminRow]
        : [{ ...enrollmentRow, id: 1, status: 'pending' }],
    );

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(409);
  });

  test('returns 400 when the student is already approved', async () => {
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

  test('re-submits a rejected request by resetting it to pending', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.includes('FROM users')) return [adminRow];
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) {
        return [{ ...enrollmentRow, id: 9, status: 'rejected' }];
      }
      if (sql.includes('UPDATE enrollments SET status =')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, id: 9, status: 'pending' }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set(adminHeader)
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
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

// For review actions the controller reads the enrollment (GET), then updates
// (review/UPDATE), then reads again. We dispatch by call order.
function mockReview(userRow, currentRow, updatedRow) {
  let calls = 0;
  query.mockImplementation(async (sql) => {
    if (String(sql).includes('FROM users')) return [userRow];
    calls += 1;
    if (String(sql).includes('UPDATE enrollments')) return { affectedRows: 1 };
    return [calls === 1 ? currentRow : updatedRow];
  });
}

describe('PATCH /api/enrollments/:id/approve', () => {
  test('returns 200 and approves a pending enrollment when documents are verified', async () => {
    mockReview(
      adminRow,
      { ...enrollmentRow, status: 'pending' },
      { ...enrollmentRow, status: 'approved' },
    );

    const res = await request(app)
      .patch('/api/enrollments/1/approve')
      .set(adminHeader)
      .send({ doc_grade12: 1, doc_transcript: 1, doc_idcopy: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  test('returns 400 when documents are not all verified', async () => {
    mockReview(
      adminRow,
      { ...enrollmentRow, status: 'pending', doc_grade12: 0 },
      { ...enrollmentRow, status: 'pending', doc_idcopy: 0 },
    );

    const res = await request(app)
      .patch('/api/enrollments/1/approve')
      .set(adminHeader)
      .send({ doc_grade12: 1, doc_transcript: 1, doc_idcopy: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All required documents must be verified before approval');
  });

  test('returns 403 when a student tries to approve', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/approve')
      .set(studentHeader);

    expect(res.status).toBe(403);
  });

  test('returns 400 when the enrollment is not pending', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [adminRow] : [enrollmentRow],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/approve')
      .set(adminHeader);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/enrollments/:id/reject', () => {
  test('returns 200 and rejects a pending enrollment', async () => {
    mockReview(
      adminRow,
      { ...enrollmentRow, status: 'pending' },
      { ...enrollmentRow, status: 'rejected' },
    );

    const res = await request(app)
      .patch('/api/enrollments/1/reject')
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
  });

  test('returns 403 when a student tries to reject', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/reject')
      .set(studentHeader);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/enrollments/:id/pay', () => {
  test('returns 200 and marks an approved unpaid enrollment as paid', async () => {
    mockReview(
      studentRow,
      { ...enrollmentRow, student_id: 42, status: 'approved', payment_status: 'unpaid' },
      { ...enrollmentRow, student_id: 42, status: 'approved', payment_status: 'paid' },
    );

    const res = await request(app)
      .patch('/api/enrollments/1/pay')
      .set(studentHeader)
      .send({ method: 'Credit Card', reference: 'TXN-123' });

    expect(res.status).toBe(200);
    expect(res.body.payment_status).toBe('paid');
  });

  test('returns 400 when the enrollment is not approved', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users')
        ? [studentRow]
        : [{ ...enrollmentRow, student_id: 42, status: 'pending' }],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/pay')
      .set(studentHeader)
      .send({ method: 'Credit Card' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when the enrollment is already paid', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users')
        ? [studentRow]
        : [{ ...enrollmentRow, student_id: 42, status: 'approved', payment_status: 'paid' }],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/pay')
      .set(studentHeader)
      .send({ method: 'Credit Card' });

    expect(res.status).toBe(400);
  });

  test('returns 403 when paying someone else enrollment', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/pay')
      .set(studentHeader)
      .send({ method: 'Credit Card' });

    expect(res.status).toBe(403);
  });

  test('returns 400 when payment method is missing', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users')
        ? [studentRow]
        : [{ ...enrollmentRow, student_id: 42, status: 'approved', payment_status: 'unpaid' }],
    );

    const res = await request(app)
      .patch('/api/enrollments/1/pay')
      .set(studentHeader)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/enrollments/:id', () => {
  test('returns 200 and lets a moderator approve a pending enrollment', async () => {
    mockReview(
      adminRow,
      { ...enrollmentRow, status: 'pending' },
      { ...enrollmentRow, status: 'approved' },
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(adminHeader)
      .send({ status: 'approved', doc_grade12: 1, doc_transcript: 1, doc_idcopy: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  test('returns 200 and lets a moderator drop an approved enrollment', async () => {
    mockReview(
      adminRow,
      { ...enrollmentRow, status: 'approved' },
      { ...enrollmentRow, status: 'dropped' },
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(adminHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('dropped');
  });

  test('lets a student drop their own approved enrollment', async () => {
    mockReview(
      studentRow,
      { ...enrollmentRow, student_id: 42, status: 'approved' },
      { ...enrollmentRow, student_id: 42, status: 'dropped' },
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(studentHeader)
      .send({ status: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('dropped');
  });

  test('lets a student save a draft on their own pending enrollment', async () => {
    mockReview(
      studentRow,
      { ...enrollmentRow, student_id: 42, status: 'pending' },
      { ...enrollmentRow, student_id: 42, status: 'pending', doc_grade12: 1 },
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(studentHeader)
      .send({ doc_grade12: 1, notes: 'will upload transcript later' });

    expect(res.status).toBe(200);
    expect(res.body.doc_grade12).toBe(1);
  });

  test('returns 403 when a student tries to approve', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [enrollmentRow],
    );

    const res = await request(app)
      .put('/api/enrollments/1')
      .set(studentHeader)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
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
      sql.includes('FROM users') ? [adminRow] : [enrollmentRow],
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
      if (sql.includes('UPDATE enrollments')) return { affectedRows: 0 };
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

  test('returns 403 when a student deletes an enrollment', async () => {
    query.mockImplementation(async (sql) =>
      sql.includes('FROM users') ? [studentRow] : [],
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
