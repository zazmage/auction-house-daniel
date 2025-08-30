import { boot } from '../main/boot.js'
import { renderListingCard } from '../ui/listingCard.js'
import { apiListListings } from '../api/listings.api.js'
import { getProfile } from '../auth/auth.js'
import { apiGetProfileBids } from '../api/profiles.api.js'
import { ensureApiKey, getToken } from '../auth/auth.js'

boot()

const featuredContainer = document.getElementById('featured-listings')
  ; (async () => {
    try {
      const data = await apiListListings({ limit: 3, sort: 'created', sortOrder: 'desc', _bids: true })
      const items = data.data || data
      items.forEach(l => {
        const adapted = {
          id: l.id,
          title: l.title,
          description: l.description,
          media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
          deadline: l.endsAt || l.deadline,
          ownerName: l.seller?.name || l.profile?.name,
          highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
        }
        featuredContainer.appendChild(renderListingCard(adapted))
      })
    } catch (e) {
      featuredContainer.innerHTML = '<p class="text-sm text-red-600">Failed to load listings.</p>'
    }
  })()

// Active bids section (mirrors robust logic from dashboard)
const activeWrap = document.getElementById('active-bids')
const statusEl = document.getElementById('active-bids-status')
const ctaBox = document.getElementById('active-bids-cta')
  ; (async () => {
    const prof = getProfile()
    if (!prof || !getToken()) {
      statusEl.textContent = ''
      if (ctaBox) { ctaBox.classList.remove('hidden'); ctaBox.classList.add('flex', 'flex-col') }
      return
    }
    try { await ensureApiKey() } catch { }
    let bids = []
    const name = prof.name || prof.data?.name
    if (!name) { statusEl.textContent = 'Profile name missing.'; return }
    try {
      // Try plural first
      let res = await apiGetProfileBids(name, { _listings: true })
      bids = res.data || res
      if (!Array.isArray(bids) || bids.length === 0) {
        // Fallback singular
        res = await apiGetProfileBids(name, { _listing: true })
        bids = res.data || res
      }
    } catch (e) {
      try {
        const res = await apiGetProfileBids(name, {})
        bids = res.data || res
      } catch { }
    }
    if (!Array.isArray(bids) || bids.length === 0) { statusEl.textContent = 'No active bids yet.'; return }
    // Build set of active listings
    const now = Date.now()
    const listingMap = new Map()
    bids.forEach(b => {
      const listing = b.listing || (b.listings && b.listings[0])
      if (!listing) return
      const ends = new Date(listing.endsAt || listing.deadline || listing.ends_at).getTime()
      if (isNaN(ends) || ends < now) return
      if (!listingMap.has(listing.id)) listingMap.set(listing.id, listing)
    })
    const activeListings = Array.from(listingMap.values())
    if (activeListings.length === 0) { statusEl.textContent = 'No active bids yet.'; return }
    statusEl.textContent = ''
    activeListings.forEach(l => {
      const adapted = {
        id: l.id,
        title: l.title,
        description: l.description,
        media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
        deadline: l.endsAt || l.deadline,
        ownerName: l.seller?.name || l.profile?.name,
        highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
      }
      activeWrap.appendChild(renderListingCard(adapted))
    })
  })()
