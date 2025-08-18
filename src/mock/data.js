// Mock in-memory data + localStorage persistence for the prototype (no real API calls)
const STORAGE_KEY = 'auction_mock_state_v1'
const initial = {
  users: [
    { id: 'u1', name: 'Alice', email: 'alice@stud.noroff.no', password: 'password', credits: 1500, bio: 'Collector of vintage items.', avatar: 'https://placehold.co/100?text=A' },
    { id: 'u2', name: 'Bob', email: 'bob@stud.noroff.no', password: 'password', credits: 900, bio: 'New to auctions!', avatar: 'https://placehold.co/100?text=B' },
  ],
  listings: [
    { id: 'l1', title: 'Retro Camera', description: 'A classic 35mm film camera in working condition.', media: ['https://placehold.co/400x225?text=Camera'], deadline: new Date(Date.now() + 86400000).toISOString(), ownerId: 'u1', bids: [{ id: 'b1', userId: 'u2', amount: 120, created: new Date().toISOString() }], created: new Date().toISOString() },
    { id: 'l2', title: 'Gaming Console', description: 'Old school console with 2 controllers.', media: [], deadline: new Date(Date.now() + 172800000).toISOString(), ownerId: 'u2', bids: [], created: new Date().toISOString() },
  ],
  session: null,
}
function load() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : structuredClone(initial) } catch { return structuredClone(initial) } }
function save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
let state = load()
const uid = () => Math.random().toString(36).slice(2, 10)
export function currentUser() { return state.session ? state.users.find(u => u.id === state.session.userId) : null }
export function login(email, password) { const user = state.users.find(u => u.email === email && u.password === password); if (!user) return { error: 'Invalid credentials' }; state.session = { userId: user.id }; save(state); return { user } }
export function logout() { state.session = null; save(state) }
export function register({ name, email, password }) { if (!email.endsWith('@stud.noroff.no')) return { error: 'Email must end with @stud.noroff.no' }; if (state.users.some(u => u.email === email)) return { error: 'Email already registered' }; const user = { id: uid(), name, email, password, credits: 1000, bio: '', avatar: 'https://placehold.co/100?text=' + name[0] }; state.users.push(user); state.session = { userId: user.id }; save(state); return { user } }
function augmentListing(l) { const owner = state.users.find(u => u.id === l.ownerId); const highest = l.bids.reduce((m, b) => (b.amount > m ? b.amount : m), 0); return { ...l, ownerName: owner?.name || 'Unknown', highest } }
export function listListings(query) { let items = [...state.listings]; if (query) { const q = query.toLowerCase(); items = items.filter(l => l.title.toLowerCase().includes(q)) } return items.map(augmentListing) }
export function getListing(id) { const l = state.listings.find(l => l.id === id); return l ? augmentListing(l) : null }
export function createListing({ title, description, media, deadline }) { const user = currentUser(); if (!user) return { error: 'Not logged in' }; const listing = { id: uid(), title, description, media, deadline, ownerId: user.id, bids: [], created: new Date().toISOString() }; state.listings.push(listing); save(state); return { listing: augmentListing(listing) } }
export function updateListing(id, data) { const user = currentUser(); const idx = state.listings.findIndex(l => l.id === id); if (idx === -1) return { error: 'Not found' }; if (state.listings[idx].ownerId !== user?.id) return { error: 'Not owner' }; state.listings[idx] = { ...state.listings[idx], ...data }; save(state); return { listing: augmentListing(state.listings[idx]) } }
export function deleteListing(id) { const user = currentUser(); const idx = state.listings.findIndex(l => l.id === id); if (idx === -1) return { error: 'Not found' }; if (state.listings[idx].ownerId !== user?.id) return { error: 'Not owner' }; state.listings.splice(idx, 1); save(state); return { ok: true } }
export function placeBid(listingId, amount) { const user = currentUser(); if (!user) return { error: 'Not logged in' }; const l = state.listings.find(l => l.id === listingId); if (!l) return { error: 'Listing not found' }; if (l.ownerId === user.id) return { error: 'Cannot bid on own listing' }; const highest = l.bids.reduce((m, b) => (b.amount > m ? b.amount : m), 0); if (amount <= highest) return { error: 'Bid must be higher than current highest' }; if (amount > user.credits) return { error: 'Insufficient credits' }; l.bids.push({ id: uid(), userId: user.id, amount, created: new Date().toISOString() }); user.credits -= amount; save(state); return { listing: augmentListing(l) } }
export function updateProfile(partial) { const user = currentUser(); if (!user) return { error: 'Not logged in' }; Object.assign(user, partial); save(state); return { user } }
export function myListings() { const u = currentUser(); if (!u) return []; return state.listings.filter(l => l.ownerId === u.id).map(augmentListing) }
export function myBids() { const u = currentUser(); if (!u) return []; return state.listings.filter(l => l.bids.some(b => b.userId === u.id)).map(l => ({ listingId: l.id, title: l.title, highest: l.bids.reduce((m, b) => (b.amount > m ? b.amount : m), 0) })) }
export function ensureMock() { return { reset() { state = structuredClone(initial); save(state) } } }
window.__AUCTION_STATE__ = state
