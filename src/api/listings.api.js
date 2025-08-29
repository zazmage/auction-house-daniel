import { http } from './http.js'

// Listings
const BASE_PATH = '/auction/listings'
export function apiListListings(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(BASE_PATH + (qs ? `?${qs}` : ''))
}
export function apiGetListing(id, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get(`${BASE_PATH}/${id}` + (qs ? `?${qs}` : ''))
}
export function apiCreateListing(body) {
  return http.post(BASE_PATH, body, { auth: true })
}
export function apiUpdateListing(id, body) {
  return http.put(`${BASE_PATH}/${id}`, body, { auth: true })
}
export function apiDeleteListing(id) {
  return http.del(`${BASE_PATH}/${id}`, { auth: true })
}
export function apiBidOnListing(id, amount) {
  return http.post(`${BASE_PATH}/${id}/bids`, { amount }, { auth: true })
}
