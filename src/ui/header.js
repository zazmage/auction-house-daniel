import headerTpl from './header.html?raw'
import { userStore } from '../state/user.js'
import { logoutUser, getProfile } from '../auth/auth.js'

export function mountHeader(el) {
  el.innerHTML = headerTpl
  const authEls = el.querySelectorAll('[data-auth]')
  const guestEls = el.querySelectorAll('[data-guest]')

  function render(state) {
    const profile = state?.profile || getProfile()
    if (profile) {
      authEls.forEach(e => e.classList.remove('hidden'))
      guestEls.forEach(e => e.classList.add('hidden'))
      const credits = profile.credits ?? profile?.data?.credits ?? 0
      const creditsEl = el.querySelector('#nav-credits')
      if (creditsEl) creditsEl.textContent = credits + ' cr'
    } else {
      authEls.forEach(e => e.classList.add('hidden'))
      guestEls.forEach(e => e.classList.remove('hidden'))
    }
  }

  userStore.subscribe(render)

  el.querySelector('#nav-logout')?.addEventListener('click', () => { logoutUser(); location.href = '/' })

  // Mobile toggle
  const toggleBtn = el.querySelector('#nav-toggle')
  const menu = el.querySelector('#nav-menu')
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
      if (open) {
        menu.classList.add('animate-in')
      }
    })
    // Close on nav link click (mobile)
    menu.querySelectorAll('a,button').forEach(item => item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        menu.classList.add('hidden')
        toggleBtn.setAttribute('aria-expanded', 'false')
      }
    }))
    // Close on outside click
    document.addEventListener('click', e => {
      if (window.innerWidth >= 768) return
      if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
        menu.classList.add('hidden')
        toggleBtn.setAttribute('aria-expanded', 'false')
      }
    })
  }
}
