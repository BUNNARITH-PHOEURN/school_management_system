const { signToken } = require('../src/utils/token');

function tokenFor(userId, role = 'admin') {
  return signToken({ id: userId, role });
}

function authHeader(userId, role = 'admin') {
  return { Authorization: `Bearer ${tokenFor(userId, role)}` };
}

module.exports = { tokenFor, authHeader };