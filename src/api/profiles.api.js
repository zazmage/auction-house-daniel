import { http } from './http.js'

export function apiGetProfile(name) {
  return http.get(`/profiles/${encodeURIComponent(name)}`)
}

export function apiUpdateProfile(name, body) {
  return http.put(`/profiles/${encodeURIComponent(name)}`, body, { auth: true })
}
