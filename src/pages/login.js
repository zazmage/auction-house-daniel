import { boot } from '../main/boot.js'
import { loginUser } from '../auth/auth.js'
import { requireGuest } from '../auth/guard.js'

boot()

const proceed = requireGuest()
if (proceed) {
  const form = document.getElementById('login-form')
  form?.addEventListener('submit', async e => {
    e.preventDefault()
    const fd = new FormData(form)
    const email = fd.get('email')
    const password = fd.get('password')
    try {
      await loginUser({ email, password })
      const next = new URLSearchParams(location.search).get('next') || '/user/dashboard'
      location.href = next
    } catch (err) {
      alert(err.message || 'Login failed')
    }
  })
}
