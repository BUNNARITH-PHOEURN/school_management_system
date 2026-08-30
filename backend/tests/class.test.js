const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const adminUser = {
  id: 1,
  name: 'Alexandra Chen',
  email: 'admin@school.edu',
  role: 'admin',
  status: 'active',
  teacher_id: null,
  last_login: null,
};

const modUser = {
  id: 2,
  name: 'Benjamin Torres',
  email: 'b.torres@school.edu',
  role: 'moderator',
  status: 'active',
  teacher_id: 1,
  last_login: null,
};

const classRow = {
  id: 1,
  name: 'Algebra I — Section A',
  academic_year_id: 3,
  subject_id: 1,
  room: 'Room 101',
  day: 'Monday / Wednesday',
  start_time: '08:00:00',
  end_time: '09:30:00',
  status: 'active',
};

beforeEach(() => {
  query.mockReset();
});

describe('GET /api/classes', () => {
  test('returns 200 and all classes', async () => {
    query.mockResolvedValue([classRow]);

    const res = await request(app).get('/api/classes');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 1, name: 'Algebra I — Section A' });
  });
});

describe('GET /api/classes/mine', () => {
  test('returns 401 without an x-user-id header', async () => {
    const res = await request(app).get('/api/classes/mine');

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('admin sees every class', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce([classRow]);

    const res = await request(app).get('/api/classes/mine').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 1, name: 'Algebra I — Section A' });
  });

  test('moderator only sees the classes of their assigned teacher', async () => {
    query.mockResolvedValueOnce([modUser]);
    query.mockResolvedValueOnce([{ ...classRow, id: 6 }, { ...classRow, id: 26 }]);

    const res = await request(app).get('/api/classes/mine').set('x-user-id', '2');

    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.id)).toEqual([6, 26]);

    const [sql, params] = query.mock.calls[1];
    expect(sql).toContain('JOIN class_teachers');
    expect(params).toEqual([1]);
  });

  test('moderator without a teacher sees no classes', async () => {
    query.mockResolvedValueOnce([{ ...modUser, teacher_id: null }]);

    const res = await request(app).get('/api/classes/mine').set('x-user-id', '2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/classes/:id', () => {
  test('returns 200 and the class when found', async () => {
    query.mockResolvedValue([classRow]);

    const res = await request(app).get('/api/classes/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(classRow);
  });

  test('returns 404 when the class does not exist', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/classes/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Class not found' });
  });

  test('returns 400 for an invalid id', async () => {
    const res = await request(app).get('/api/classes/abc');

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('POST /api/classes', () => {
  test('returns 201 and creates the class', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('INSERT')) return { insertId: 2 };
      return [{ ...classRow, id: 2, name: 'Physics — Section B' }];
    });

    const res = await request(app).post('/api/classes').send({ name: 'Physics — Section B' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 2, name: 'Physics — Section B', status: 'active' });
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/classes').send({ room: 'Room 1' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('name is required');
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when status is invalid', async () => {
    const res = await request(app).post('/api/classes').send({ name: 'X', status: 'paused' });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('PUT /api/classes/:id', () => {
  test('returns 200 with a full update', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...classRow, name: 'Algebra II', status: 'inactive' }];
    });

    const res = await request(app).put('/api/classes/1').send({ name: 'Algebra II', status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Algebra II');
    expect(res.body.status).toBe('inactive');
  });

  test('returns 404 when the class does not exist', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
      return [];
    });

    const res = await request(app).put('/api/classes/999').send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/classes/:id', () => {
  test('returns 200 when the class is deleted', async () => {
    query.mockResolvedValue({ affectedRows: 1 });

    const res = await request(app).delete('/api/classes/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Class deleted successfully' });
  });

  test('returns 404 when the class does not exist', async () => {
    query.mockResolvedValue({ affectedRows: 0 });

    const res = await request(app).delete('/api/classes/999');

    expect(res.status).toBe(404);
  });
});