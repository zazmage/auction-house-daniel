import { boot } from '../main/boot.js'
import { registerUser } from '../auth/auth.js'
import { requireGuest } from '../auth/guard.js'

boot()

const proceedReg = requireGuest()
if (proceedReg) {
  const form = document.getElementById('register-form')
  form?.addEventListener('submit', async e => {
    e.preventDefault()
    const fd = new FormData(form)
    const payload = Object.fromEntries(fd.entries())
    const msg = document.getElementById('register-msg')
    msg.textContent = ''
    if (payload.password !== payload.passwordConfirm) {
      msg.textContent = 'Passwords do not match'
      msg.className = 'text-sm text-red-600'
      return
    }
    try {
      // Remove confirm field before API call
      const { passwordConfirm, ...clean } = payload
      await registerUser(clean)
      msg.textContent = 'Registered! Redirecting...'
      msg.className = 'text-sm text-green-600'
      setTimeout(() => (location.href = '/user/dashboard'), 800)
    } catch (err) {
      msg.textContent = err.message || 'Registration failed'
      msg.className = 'text-sm text-red-600'
      alert(err.message || 'Registration failed')
    }
  })
}
