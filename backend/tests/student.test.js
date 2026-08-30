const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const validStudent = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 555-0101',
  department_id: 1,
  gender: 'male',
  date_of_birth: '2005-04-12',
  address: '12 Maple Street',
};

const studentRow = {
  id: 1,
  code: 'STU-001',
  ...validStudent,
  status: 'active',
  enrolled_at: '2026-08-24',
};

beforeEach(() => {
  query.mockReset();
});

describe('GET /api/students', () => {
  test('returns 200 and all students', async () => {
    query.mockResolvedValue([studentRow]);

    const res = await request(app).get('/api/students');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 1, email: 'john.doe@example.com' });
  });

  test('returns 500 when the database fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    query.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/api/students');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    consoleErrorSpy.mockRestore();
  });
});

describe('GET /api/students/:id', () => {
  test('returns 200 and the student when found', async () => {
    query.mockResolvedValue([studentRow]);

    const res = await request(app).get('/api/students/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(studentRow);
    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM students WHERE id = ? LIMIT 1',
      [1],
    );
  });

  test('returns 404 when the student does not exist', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/students/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Student not found' });
  });

  test('returns 400 for an invalid id without hitting the database', async () => {
    const res = await request(app).get('/api/students/abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid student id' });
    expect(query).not.toHaveBeenCalled();
  });
});

describe('POST /api/students', () => {
  test('returns 201, inserts the student and auto-generates a code', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('INSERT')) return { insertId: 1 };
      if (sql.startsWith('UPDATE students SET code')) return { affectedRows: 1 };
      return [{ ...studentRow }];
    });

    const res = await request(app).post('/api/students').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, code: 'STU-001' });

    const insertCall = query.mock.calls.find((c) => c[0].startsWith('INSERT'));
    expect(insertCall[0]).toContain('first_name, last_name, email');
    expect(insertCall[0]).toContain('department_id');
  });

  test('uses the provided code instead of generating one', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('INSERT')) return { insertId: 2 };
      return [{ ...studentRow, id: 2, code: 'CUSTOM-42' }];
    });

    const res = await request(app)
      .post('/api/students')
      .send({ ...validStudent, code: 'CUSTOM-42' });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('CUSTOM-42');
    const codeUpdate = query.mock.calls.find((c) =>
      c[0].startsWith('UPDATE students SET code'),
    );
    expect(codeUpdate).toBeUndefined();
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ email: 'john.doe@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        'first_name is required',
        'last_name is required',
      ]),
    );
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when the email is invalid', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ ...validStudent, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('a valid email is required');
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when date_of_birth has an invalid format', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ ...validStudent, date_of_birth: '12-04-2005' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain(
      'date_of_birth must be in YYYY-MM-DD format',
    );
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when gender is not allowed', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ ...validStudent, gender: 'unknown' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatch(/gender must be one of/);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when status is not allowed', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ ...validStudent, status: 'paused' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatch(/status must be one of/);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('PUT /api/students/:id', () => {
  test('returns 200 with a full update', async () => {
    const updatedRow = { ...studentRow, first_name: 'Jane', status: 'inactive' };

    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [updatedRow];
    });

    const res = await request(app)
      .put('/api/students/1')
      .send({ ...validStudent, first_name: 'Jane', status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Jane');
    expect(res.body.status).toBe('inactive');

    const updateSql = query.mock.calls.find((c) => c[0].startsWith('UPDATE'))[0];
    expect(updateSql).toContain('first_name = ?');
    expect(updateSql).toContain('status = ?');
  });

  test('supports partial updates (status toggle)', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...studentRow, status: 'inactive' }];
    });

    const res = await request(app)
      .put('/api/students/1')
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  test('normalizes empty strings to null for optional fields', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [studentRow];
    });

    const res = await request(app)
      .put('/api/students/1')
      .send({ phone: '' });

    expect(res.status).toBe(200);
    const [, params] = query.mock.calls.find((c) => c[0].startsWith('UPDATE'));
    expect(params[0]).toBeNull();
  });

  test('returns 404 when updating a non-existent student', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
      return [];
    });

    const res = await request(app)
      .put('/api/students/999')
      .send(validStudent);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Student not found' });
  });

  test('returns 400 when the payload is invalid', async () => {
    const res = await request(app)
      .put('/api/students/1')
      .send({ email: 'bad-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('a valid email is required');
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when there are no valid fields to update', async () => {
    const res = await request(app)
      .put('/api/students/1')
      .send({ nonsense_field: 'x' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No valid fields to update' });
    expect(query).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/students/:id', () => {
  test('returns 200 when the student is deleted', async () => {
    query.mockResolvedValue({ affectedRows: 1 });

    const res = await request(app).delete('/api/students/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Student deleted successfully' });
    expect(query).toHaveBeenCalledWith('DELETE FROM students WHERE id = ?', [
      1,
    ]);
  });

  test('returns 404 when deleting a non-existent student', async () => {
    query.mockResolvedValue({ affectedRows: 0 });

    const res = await request(app).delete('/api/students/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Student not found' });
  });

  test('returns 400 for an invalid id', async () => {
    const res = await request(app).delete('/api/students/0');

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});
