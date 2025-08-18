import { getToken, getProfile } from './auth.js'

export function requireAuth() {
  if (!getToken() || !getProfile()) {
    location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search)
    return false
  }
  return true
}

export function requireGuest() {
  if (getToken()) {
    location.href = '/user/dashboard.html'
    return false
  }
  return true
}
