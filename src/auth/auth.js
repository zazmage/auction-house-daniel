import { storage } from '../utils/storage.js'
import { apiLogin, apiRegister, apiCreateApiKey } from '../api/auth.api.js'
import { validateRegistration } from './validators.js'
import { userStore } from '../state/user.js'

const PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'auction'
const TOKEN_KEY = `${PREFIX}_auth_token`
const PROFILE_KEY = `${PREFIX}_auth_profile`
const API_KEY_KEY = `${PREFIX}_api_key`

export function getToken() { return storage.get(TOKEN_KEY) }
export function getProfile() { return storage.get(PROFILE_KEY) }
export function getApiKey() { return storage.get(API_KEY_KEY) }

export function setSession(token, profile) {
  storage.set(TOKEN_KEY, token)
  storage.set(PROFILE_KEY, profile)
  userStore.set({ profile, token })
}

export function clearSession() {
  storage.remove(TOKEN_KEY)
  storage.remove(PROFILE_KEY)
  storage.remove(API_KEY_KEY)
  userStore.set({ profile: null, token: null, apiKey: null })
}

export async function registerUser(form) {
  const err = validateRegistration(form)
  if (err) throw new Error(err)
  const data = await apiRegister(form)
  // Immediately login after register (API returns user but not token) -> perform login
  const loginRes = await apiLogin({ email: form.email, password: form.password })
  setSession(loginRes.data.accessToken, loginRes.data)
  if (import.meta.env.VITE_AUTO_CREATE_API_KEY === 'true') {
    await ensureApiKey()
  }
  return loginRes
}

export async function loginUser({ email, password }) {
  const res = await apiLogin({ email, password })
  setSession(res.data.accessToken, res.data)
  if (import.meta.env.VITE_AUTO_CREATE_API_KEY === 'true') {
    await ensureApiKey()
  }
  return res
}

export function logoutUser() { clearSession() }

export async function ensureApiKey() {
  if (getApiKey()) return getApiKey()
  const existing = import.meta.env.VITE_API_KEY
  if (existing) {
    storage.set(API_KEY_KEY, existing)
    userStore.set({ ...userStore.state, apiKey: existing })
    return existing
  }
  try {
    const res = await apiCreateApiKey()
    const apiKey = res.data?.key || res.key
    if (apiKey) {
      storage.set(API_KEY_KEY, apiKey)
      userStore.set({ ...userStore.state, apiKey })
      return apiKey
    }
  } catch (e) {
    console.warn('Failed to create API key', e)
  }
  return null
}
