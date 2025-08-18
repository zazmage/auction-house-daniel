import { boot } from '../main/boot.js'
import { login as mockLogin } from '../mock/data.js'
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
      if (import.meta.env.VITE_API_BASE) {
        await loginUser({ email, password })
      } else {
        const { error } = mockLogin(email, password)
        if (error) throw new Error(error)
      }
      const next = new URLSearchParams(location.search).get('next') || '/user/dashboard.html'
      location.href = next
    } catch (err) {
      alert(err.message || 'Login failed')
    }
  })
}
