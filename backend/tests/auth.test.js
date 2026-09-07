const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');
const { hashPassword } = require('../src/utils/password');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const userRow = {
  id: 1,
  name: 'Alexandra Chen',
  email: 'admin@school.edu',
  password_hash: hashPassword('password'),
  role: 'admin',
  status: 'active',
  last_login: null,
};

beforeEach(() => {
  query.mockReset();
});

describe('POST /api/auth/login', () => {
  test('returns 200 and the session user on valid credentials', async () => {
    query.mockResolvedValueOnce([userRow]);
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.edu', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 1,
      name: 'Alexandra Chen',
      email: 'admin@school.edu',
      role: 'admin',
      status: 'active',
    });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(query).toHaveBeenCalledWith(
      'UPDATE users SET last_login = ? WHERE id = ?',
      [expect.any(Date), 1],
    );
  });

  test('returns 401 on wrong password', async () => {
    query.mockResolvedValue([userRow]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.edu', password: 'nope' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('returns 401 on unknown email', async () => {
    query.mockResolvedValue([{}]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@school.edu', password: 'password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('returns 401 for inactive accounts', async () => {
    query.mockResolvedValue([{ ...userRow, status: 'inactive' }]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.edu', password: 'password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@school.edu' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(['email and password are required']);
  });
});

describe('POST /api/auth/register', () => {
  test('creates an active student account without returning its password hash', async () => {
    query.mockResolvedValueOnce([]); // findByEmail
    query.mockResolvedValueOnce({ insertId: 7 }); // INSERT INTO users
    query.mockResolvedValueOnce([]); // getStudentByEmail (no existing student)
    query.mockResolvedValueOnce({ insertId: 60 }); // INSERT INTO students
    query.mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE students SET code
    query.mockResolvedValueOnce([{ id: 60, code: 'STU-060', first_name: 'New', last_name: 'User', email: 'new@school.edu' }]); // getStudentById
    query.mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE users SET student_id
    query.mockResolvedValueOnce([{ id: 7, name: 'New User', email: 'new@school.edu', role: 'student', status: 'active', last_login: null }]); // findById

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'NEW@school.edu', password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: 7,
      name: 'New User',
      email: 'new@school.edu',
      role: 'student',
      status: 'active',
      lastLogin: null,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['New User', 'new@school.edu', hashPassword('password1')],
    );
  });

  test('rejects a duplicate email', async () => {
    query.mockResolvedValueOnce([userRow]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'admin@school.edu', password: 'password1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('An account with this email already exists');
  });

  test('validates registration fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'bad-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      'name must be at least 2 characters',
      'a valid email is required',
      'password must be at least 8 characters',
    ]);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 200 and the user when x-user-id is valid', async () => {
    query.mockResolvedValue([userRow]);

    const res = await request(app).get('/api/auth/me').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 1, email: 'admin@school.edu' });
  });

  test('returns 401 without x-user-id header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });

  test('returns 401 when the user was deleted or deactivated', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/auth/me').set('x-user-id', '999');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authenticated');
  });
});
