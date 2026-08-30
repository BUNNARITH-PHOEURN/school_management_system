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

const modClasses = [{ id: 6 }, { id: 26 }, { id: 30 }];

const attendanceRow = {
  id: 1,
  student_id: 1,
  class_id: 2,
  date: '2026-08-11',
  status: 'present',
  remarks: '',
  student_code: 'STU-001',
  student_name: 'Amara Osei',
  class_name: 'CS Intro — Section A',
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

beforeEach(() => {
  query.mockReset();
});

describe('GET /api/attendance', () => {
  test('returns 200 and all records with names', async () => {
    query.mockResolvedValue([attendanceRow]);

    const res = await request(app).get('/api/attendance');

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      student_name: 'Amara Osei',
      class_name: 'CS Intro — Section A',
    });
  });

  test('passes class_id and date filters to the query', async () => {
    query.mockResolvedValue([]);

    await request(app).get('/api/attendance?class_id=2&date=2026-08-11');

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('a.class_id = ?');
    expect(sql).toContain('a.date = ?');
    expect(params).toEqual([2, '2026-08-11']);
  });

  test('ignores an invalid date filter', async () => {
    query.mockResolvedValue([]);

    await request(app).get('/api/attendance?date=11-08-2026');

    const [sql, params] = query.mock.calls[0];
    expect(sql).not.toContain('a.date = ?');
    expect(params).toEqual([]);
  });
});

describe('POST /api/attendance', () => {
  test('returns 201 and creates the record', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce({ insertId: 9 });
    query.mockResolvedValueOnce([{ ...attendanceRow, id: 9, status: 'late', remarks: 'Traffic' }]);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '1')
      .send({
        student_id: 1,
        class_id: 2,
        date: '2026-08-21',
        status: 'late',
        remarks: 'Traffic',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 9, status: 'late', remarks: 'Traffic' });
  });

  test('returns 400 for an invalid status', async () => {
    query.mockResolvedValueOnce([adminUser]);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '1')
      .send({ student_id: 1, class_id: 2, date: '2026-08-21', status: 'on-time' });

    expect(res.status).toBe(400);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('returns 400 for a bad date format', async () => {
    query.mockResolvedValueOnce([adminUser]);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '1')
      .send({ student_id: 1, class_id: 2, date: '21/08/2026', status: 'present' });

    expect(res.status).toBe(400);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('returns 401 without an x-user-id header', async () => {
    const res = await request(app).post('/api/attendance').send({ student_id: 1 });

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  test('blocks a moderator from writing a past date', async () => {
    query.mockResolvedValueOnce([modUser]);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '2')
      .send({ student_id: 1, class_id: 6, date: '2026-08-21', status: 'present' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/administrators/);
  });

  test('blocks a moderator from a class they do not teach', async () => {
    const today = localToday();
    query.mockResolvedValueOnce([modUser]);
    query.mockResolvedValueOnce(modClasses);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '2')
      .send({ student_id: 1, class_id: 2, date: today, status: 'present' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own classes/);
  });

  test('allows a moderator to take attendance today for their own class', async () => {
    const today = localToday();
    query.mockResolvedValueOnce([modUser]);
    query.mockResolvedValueOnce(modClasses);
    query.mockResolvedValueOnce({ insertId: 11 });
    query.mockResolvedValueOnce([{ ...attendanceRow, id: 11, class_id: 6, date: today }]);

    const res = await request(app)
      .post('/api/attendance')
      .set('x-user-id', '2')
      .send({ student_id: 1, class_id: 6, date: today, status: 'present' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(11);
  });
});

describe('POST /api/attendance/batch', () => {
  test('returns 200 and inserts all records in one query', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce({});

    const records = [
      { student_id: 1, class_id: 2, date: '2026-08-21', status: 'present', remarks: '' },
      { student_id: 2, class_id: 2, date: '2026-08-21', status: 'absent', remarks: 'Sick' },
    ];

    const res = await request(app)
      .post('/api/attendance/batch')
      .set('x-user-id', '1')
      .send(records);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '2 attendance record(s) saved' });

    const [sql, params] = query.mock.calls[1];
    expect(sql).toContain('VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)');
    expect(params).toEqual([1, 2, '2026-08-21', 'present', '', 2, 2, '2026-08-21', 'absent', 'Sick']);
  });

  test('returns 400 when records is not a non-empty array', async () => {
    query.mockResolvedValueOnce([adminUser]);

    const res = await request(app)
      .post('/api/attendance/batch')
      .set('x-user-id', '1')
      .send([]);

    expect(res.status).toBe(400);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when a record is invalid', async () => {
    query.mockResolvedValueOnce([adminUser]);

    const res = await request(app)
      .post('/api/attendance/batch')
      .set('x-user-id', '1')
      .send([{ student_id: 1, class_id: 2, date: '2026-08-21', status: 'unknown' }]);

    expect(res.status).toBe(400);
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('blocks a moderator saving a past date in batch', async () => {
    query.mockResolvedValueOnce([modUser]);

    const res = await request(app)
      .post('/api/attendance/batch')
      .set('x-user-id', '2')
      .send([{ student_id: 1, class_id: 6, date: '2026-08-21', status: 'present' }]);

    expect(res.status).toBe(403);
    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe('PUT /api/attendance/:id', () => {
  test('returns 200 and updates status and remarks', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce([attendanceRow]);
    query.mockResolvedValueOnce({ affectedRows: 1 });
    query.mockResolvedValueOnce([{ ...attendanceRow, status: 'absent', remarks: 'Family event' }]);

    const res = await request(app)
      .put('/api/attendance/1')
      .set('x-user-id', '1')
      .send({ status: 'absent', remarks: 'Family event' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('absent');
    expect(res.body.remarks).toBe('Family event');
  });

  test('returns 404 when the record does not exist', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce([]);

    const res = await request(app)
      .put('/api/attendance/999')
      .set('x-user-id', '1')
      .send({ status: 'absent' });

    expect(res.status).toBe(404);
  });

  test('blocks a moderator editing a past date', async () => {
    query.mockResolvedValueOnce([modUser]);
    query.mockResolvedValueOnce([attendanceRow]);

    const res = await request(app)
      .put('/api/attendance/1')
      .set('x-user-id', '2')
      .send({ status: 'absent' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/administrators/);
  });

  test('blocks a moderator editing a record in a class they do not teach', async () => {
    const today = localToday();
    query.mockResolvedValueOnce([modUser]);
    query.mockResolvedValueOnce([{ ...attendanceRow, date: today }]);
    query.mockResolvedValueOnce(modClasses);

    const res = await request(app)
      .put('/api/attendance/1')
      .set('x-user-id', '2')
      .send({ status: 'present' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/own classes/);
  });
});

describe('DELETE /api/attendance/:id', () => {
  test('returns 200 when the record is deleted', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce([attendanceRow]);
    query.mockResolvedValueOnce({ affectedRows: 1 });

    const res = await request(app).delete('/api/attendance/1').set('x-user-id', '1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Attendance record deleted successfully' });
  });

  test('returns 404 when the record does not exist', async () => {
    query.mockResolvedValueOnce([adminUser]);
    query.mockResolvedValueOnce([]);

    const res = await request(app).delete('/api/attendance/999').set('x-user-id', '1');

    expect(res.status).toBe(404);
  });

  test('returns 401 without an x-user-id header', async () => {
    const res = await request(app).delete('/api/attendance/1');

    expect(res.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
});