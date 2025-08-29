import { http } from './http.js'

// Auction House profile endpoints live under /auction/profiles
const BASE = '/auction/profiles'

export function apiGetProfile(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`${BASE}/${encodeURIComponent(name)}` + (qs ? `?${qs}` : ''), { auth: true })
}
export function apiUpdateProfile(name, body) {
  return http.put(`${BASE}/${encodeURIComponent(name)}`, body, { auth: true })
}
export function apiGetProfileListings(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`${BASE}/${encodeURIComponent(name)}/listings` + (qs ? `?${qs}` : ''), { auth: true })
}
export function apiGetProfileBids(name, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`${BASE}/${encodeURIComponent(name)}/bids` + (qs ? `?${qs}` : ''), { auth: true })
}
