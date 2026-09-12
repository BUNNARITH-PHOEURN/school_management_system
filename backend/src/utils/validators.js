const PHONE_ALLOWED = /^\+?[0-9\s\-().]+$/;

// Optional field: empty/null/undefined is allowed. Otherwise it must contain
// an optional leading "+" followed by digits/spaces/dashes/parentheses/dots,
// with 7-15 digits total.
function isValidPhone(value) {
  if (value === undefined || value === null || value === '') return true;
  const str = String(value).trim();
  if (!PHONE_ALLOWED.test(str)) return false;
  const digits = str.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

module.exports = { isValidPhone };