import { http } from './http.js'

export function apiGetProfile(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`/profiles/${encodeURIComponent(name)}` + (qs ? `?${qs}` : ''))
}
export function apiUpdateProfile(name, body) {
  return http.put(`/profiles/${encodeURIComponent(name)}`, body, { auth: true })
}
export function apiGetProfileListings(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`/profiles/${encodeURIComponent(name)}/listings` + (qs ? `?${qs}` : ''))
}
export function apiGetProfileBids(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`/profiles/${encodeURIComponent(name)}/bids` + (qs ? `?${qs}` : ''))
}
