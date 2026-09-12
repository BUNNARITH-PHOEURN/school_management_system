const PHONE_ALLOWED = /^\+?[0-9\s\-().]+$/

// Optional field: empty is allowed. Otherwise it must contain an optional
// leading "+" followed by digits/spaces/dashes/parentheses/dots, with 7-15
// digits total.
export function isValidPhone(value: string): boolean {
  const str = value.trim()
  if (str === '') return true
  if (!PHONE_ALLOWED.test(str)) return false
  const digits = str.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}