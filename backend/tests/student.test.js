const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db');

const validStudent = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  date_of_birth: '2005-04-12',
  gender: 'male',
};

const studentRow = {
  id: 1,
  ...validStudent,
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
  test('returns 201 and the created student', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('INSERT')) return { insertId: 1 };
      return [{ id: 1, ...validStudent }];
    });

    const res = await request(app).post('/api/students').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, email: 'john.doe@example.com' });
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
});

describe('PUT /api/students/:id', () => {
  test('returns 200 and the updated student', async () => {
    const updatedRow = { id: 1, ...validStudent, first_name: 'Jane' };

    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [updatedRow];
    });

    const res = await request(app)
      .put('/api/students/1')
      .send({ ...validStudent, first_name: 'Jane' });

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Jane');
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
      .send({ ...validStudent, email: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('a valid email is required');
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
