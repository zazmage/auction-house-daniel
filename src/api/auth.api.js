import { http } from './http.js'
import { endpoints } from './endpoints.js'

export async function apiRegister(payload) {
  return http.post(endpoints.auth.register, payload, { auth: false })
}

export async function apiLogin(payload) {
  return http.post(endpoints.auth.login, payload, { auth: false })
}

export async function apiCreateApiKey() {
  return http.post(endpoints.auth.apiKey, {}, { auth: true })
}
