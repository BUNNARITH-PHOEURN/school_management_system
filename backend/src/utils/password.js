const crypto = require('crypto');

const SALT = 'edumanage-school-demo';

function hashPassword(password) {
  return crypto.createHash('sha256').update(`${SALT}:${password}`).digest('hex');
}

module.exports = { hashPassword };