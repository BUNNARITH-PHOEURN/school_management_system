const request = require('supertest');
const { query } = require('../src/config/db');
const app = require('../src/app');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

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
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('INSERT')) return { insertId: 9 };
      if (sql.startsWith('SELECT * FROM attendance WHERE')) {
        return [{ ...attendanceRow, id: 9, status: 'late', remarks: 'Traffic' }];
      }
      return [];
    });

    const res = await request(app).post('/api/attendance').send({
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
    const res = await request(app).post('/api/attendance').send({
      student_id: 1,
      class_id: 2,
      date: '2026-08-21',
      status: 'on-time',
    });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 for a bad date format', async () => {
    const res = await request(app).post('/api/attendance').send({
      student_id: 1,
      class_id: 2,
      date: '21/08/2026',
      status: 'present',
    });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('POST /api/attendance/batch', () => {
  test('returns 200 and inserts all records in one query', async () => {
    query.mockResolvedValue({});

    const records = [
      { student_id: 1, class_id: 2, date: '2026-08-21', status: 'present', remarks: '' },
      { student_id: 2, class_id: 2, date: '2026-08-21', status: 'absent', remarks: 'Sick' },
    ];

    const res = await request(app).post('/api/attendance/batch').send(records);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '2 attendance record(s) saved' });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)');
    expect(params).toEqual([1, 2, '2026-08-21', 'present', '', 2, 2, '2026-08-21', 'absent', 'Sick']);
  });

  test('returns 400 when records is not a non-empty array', async () => {
    const res = await request(app).post('/api/attendance/batch').send([]);

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  test('returns 400 when a record is invalid', async () => {
    const res = await request(app).post('/api/attendance/batch').send([
      { student_id: 1, class_id: 2, date: '2026-08-21', status: 'unknown' },
    ]);

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('PUT /api/attendance/:id', () => {
  test('returns 200 and updates status and remarks', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
      return [{ ...attendanceRow, status: 'absent', remarks: 'Family event' }];
    });

    const res = await request(app)
      .put('/api/attendance/1')
      .send({ status: 'absent', remarks: 'Family event' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('absent');
    expect(res.body.remarks).toBe('Family event');
  });

  test('returns 404 when the record does not exist', async () => {
    query.mockImplementation(async (sql) => {
      if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
      return [];
    });

    const res = await request(app)
      .put('/api/attendance/999')
      .send({ status: 'absent' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/attendance/:id', () => {
  test('returns 200 when the record is deleted', async () => {
    query.mockResolvedValue({ affectedRows: 1 });

    const res = await request(app).delete('/api/attendance/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Attendance record deleted successfully' });
  });

  test('returns 404 when the record does not exist', async () => {
    query.mockResolvedValue({ affectedRows: 0 });

    const res = await request(app).delete('/api/attendance/999');

    expect(res.status).toBe(404);
  });
});