import { getToken, getApiKey } from '../auth/auth.js'

const BASE = import.meta.env.VITE_API_BASE || 'https://v2.api.noroff.dev'

async function request(path, { method = 'GET', headers = {}, body, auth = false, json = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers }
  if (auth) {
    const token = getToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
    const apiKey = getApiKey?.()
    if (apiKey) finalHeaders['X-Noroff-API-Key'] = apiKey
  }
  const res = await fetch(BASE + path, { method, headers: finalHeaders, body: body && json ? JSON.stringify(body) : body })
  let data
  try { data = await res.json() } catch { data = null }
  if (!res.ok) {
    const message = data?.errors?.[0]?.message || data?.message || res.statusText
    throw new Error(message)
  }
  return data
}

export const http = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  patch: (p, body, opts) => request(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
}
