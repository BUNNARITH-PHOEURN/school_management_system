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

// True when the date (YYYY-MM-DD) is at least 18 years in the past.
export function isAtLeast18(dateOfBirth: string): boolean {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(dob.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dob <= cutoff
}