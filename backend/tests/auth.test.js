const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');
const { hashPassword } = require('../src/utils/password');
const { authHeader } = require('./authTestUtils');

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
    expect(typeof res.body.token).toBe('string');
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
    expect(typeof res.body.token).toBe('string');
    const insertCall = query.mock.calls.find(([sql]) => sql.includes('INSERT INTO users'));
    expect(insertCall[1][0]).toBe('New User');
    expect(insertCall[1][1]).toBe('new@school.edu');
    expect(insertCall[1][2]).toMatch(/^\$2[aby]\$\d{2}\$/);
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

  test('rejects a student registration with an invalid phone number', async () => {
    query.mockResolvedValueOnce([]); // findByEmail
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@school.edu', password: 'password1', gender: 'male', phone: 'not-a-phone' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('phone must be a valid phone number');
  });

  test('rejects a student registration who is under 18', async () => {
    query.mockResolvedValueOnce([]); // findByEmail
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'young@school.edu', password: 'password1', gender: 'male', date_of_birth: '2020-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('students must be at least 18 years old');
  });
});

describe('GET /api/auth/me', () => {
  test('returns 200 and the user when a valid token is provided', async () => {
    query.mockResolvedValue([userRow]);

    const res = await request(app).get('/api/auth/me').set(authHeader(1, 'admin'));

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 1, email: 'admin@school.edu' });
  });

  test('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Missing or malformed Authorization header');
  });

  test('returns 401 for a tampered or invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  test('returns 401 when the user was deleted or deactivated', async () => {
    query.mockResolvedValue([]);

    const res = await request(app).get('/api/auth/me').set(authHeader(1, 'admin'));

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or inactive user');
  });
});
