import headerTpl from './header.html?raw'
import { userStore } from '../state/user.js'
import { logoutUser, getProfile } from '../auth/auth.js'
import { currentUser, logout as mockLogout } from '../mock/data.js'

export function mountHeader(el) {
  el.innerHTML = headerTpl
  const authEls = el.querySelectorAll('[data-auth]')
  const guestEls = el.querySelectorAll('[data-guest]')

  function render(state) {
    // Prefer real auth profile; fallback to mock currentUser during transition phase
    const profile = state?.profile || getProfile() || currentUser()
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

  el.querySelector('#nav-logout')?.addEventListener('click', () => {
    logoutUser()
    try { mockLogout() } catch { }
    location.href = '/index.html'
  })
}
