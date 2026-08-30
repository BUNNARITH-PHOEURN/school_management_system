const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

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

beforeEach(() => {
  query.mockReset();
});

describe('GET /api/enrollments', () => {
  test('returns 200 and all enrollments with names', async () => {
    query.mockResolvedValue([enrollmentRow]);

    const res = await request(app).get('/api/enrollments');

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
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) return [];
      if (sql.startsWith('INSERT')) return { insertId: 5 };
      return [{ ...enrollmentRow, id: 5, student_id: 3, class_id: 5 }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .send({ student_id: 3, class_id: 5 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 5, student_id: 3, class_id: 5 });
  });

  test('returns 400 when the student is already enrolled', async () => {
    query.mockResolvedValue([enrollmentRow]);

    const res = await request(app)
      .post('/api/enrollments')
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Student is already enrolled in this class' });
  });

  test('re-enrolls a dropped student by flipping status back to enrolled', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('SELECT * FROM enrollments WHERE')) {
        return [{ ...enrollmentRow, id: 9, status: 'dropped' }];
      }
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, id: 9, status: 'enrolled' }];
    });

    const res = await request(app)
      .post('/api/enrollments')
      .send({ student_id: 1, class_id: 2 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('enrolled');
  });

  test('returns 400 when ids are missing', async () => {
    const res = await request(app).post('/api/enrollments').send({ student_id: 1 });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('PUT /api/enrollments/:id', () => {
  test('returns 200 and updates the status', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...enrollmentRow, status: 'dropped' }];
    });

    const res = await request(app).put('/api/enrollments/1').send({ status: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('dropped');
  });

  test('returns 400 for an invalid status', async () => {
    const res = await request(app).put('/api/enrollments/1').send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 404 when the enrollment does not exist', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
      return [];
    });

    const res = await request(app).put('/api/enrollments/999').send({ status: 'dropped' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/enrollments/:id', () => {
  test('returns 200 when the enrollment is deleted', async () => {
    query.mockResolvedValue({ affectedRows: 1 });

    const res = await request(app).delete('/api/enrollments/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Enrollment deleted successfully' });
  });

  test('returns 404 when the enrollment does not exist', async () => {
    query.mockResolvedValue({ affectedRows: 0 });

    const res = await request(app).delete('/api/enrollments/999');

    expect(res.status).toBe(404);
  });
});