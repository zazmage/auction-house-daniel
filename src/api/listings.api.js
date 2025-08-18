import { http } from './http.js'

export function apiListListings(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return http.get('/listings' + (qs ? `?${qs}` : ''))
}

export function apiGetListing(id) {
  return http.get(`/listings/${id}`)
}
