const domain = (import.meta.env.VITE_STUDENT_EMAIL_DOMAIN || '@stud.noroff.no').replace(/\./g, '\\.')
const re = new RegExp(domain + '$', 'i')
export function isNoroffStudentEmail(email) { return re.test(email) }

export function validateRegistration({ name, email, password }) {
  if (!name || name.length < 2) return 'Name too short'
  if (!isNoroffStudentEmail(email)) return 'Email must end with @stud.noroff.no'
  if (!password || password.length < 6) return 'Password must be at least 6 characters'
  return null
}
