const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const LEGACY_SALT = 'edumanage-school-demo';
const BCRYPT_ROUNDS = 10;

function isLegacySha256(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

function legacyHash(password) {
  return crypto.createHash('sha256').update(`${LEGACY_SALT}:${password}`).digest('hex');
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return { ok: false, needsRehash: false };

  if (isLegacySha256(storedHash)) {
    const matches = legacyHash(password) === storedHash;
    return { ok: matches, needsRehash: matches };
  }

  const ok = bcrypt.compareSync(password, storedHash);
  return { ok, needsRehash: false };
}

module.exports = { hashPassword, verifyPassword };