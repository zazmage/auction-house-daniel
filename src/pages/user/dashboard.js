import { boot } from '../../main/boot.js'
// mock usage removed
import { renderListingCard } from '../../ui/listingCard.js'
import { renderDashboardListingCard } from '../../ui/listingCardDashboard.js'
import { requireAuth } from '../../auth/guard.js'
import { getProfile, getToken, setSession, ensureApiKey } from '../../auth/auth.js'
import { apiGetProfile, apiUpdateProfile, apiGetProfileListings, apiGetProfileBids } from '../../api/profiles.api.js'
import { apiGetListing } from '../../api/listings.api.js'
import { apiDeleteListing } from '../../api/listings.api.js'

boot()

const canProceed = requireAuth()
if (!canProceed) {
  // redirected by guard
} else {
  ; (async function init() {
    const token = getToken(); if (!token) return
    await ensureApiKey()
    let user
    const baseProfile = getProfile()
    const profileName = baseProfile?.name || baseProfile?.data?.name || ''
    try {
      const res = await apiGetProfile(profileName, { _listings: true, _bids: true })
      user = res.data || res
      // persist refreshed credits/avatar/etc for navbar
      const stored = getProfile()
      if (stored && user?.credits != null) {
        setSession(getToken(), { ...stored, ...user })
      }
    } catch (e) {
      if (e.message === 'Not Found') {
        console.warn('Profile not found on server; using local auth profile')
      } else {
        console.warn('Failed to load profile', e)
      }
    }
    if (!user) {
      document.getElementById('profile-name').textContent = 'Unknown'
      document.getElementById('profile-email').textContent = ''
      document.getElementById('profile-credits').textContent = '0'
      return
    }
    document.getElementById('profile-name').textContent = user.name || profileName
    document.getElementById('profile-email').textContent = user.email || baseProfile?.email || ''
    document.getElementById('profile-credits').textContent = user.credits
    const avatarUrl = typeof user.avatar === 'string' ? user.avatar : user.avatar?.url
    if (avatarUrl) document.getElementById('profile-avatar').src = avatarUrl
    document.getElementById('profile-bio').value = user.bio || ''
    const bannerUrl = typeof user.banner === 'string' ? user.banner : user.banner?.url
    if (bannerUrl) {
      const bannerImg = document.getElementById('profile-banner')
      bannerImg.src = bannerUrl
      bannerImg.classList.remove('hidden')
      document.getElementById('profile-banner-url').value = bannerUrl
    }
    if (avatarUrl) document.getElementById('profile-avatar-url').value = avatarUrl

    document.getElementById('profile-avatar-url').addEventListener('input', e => {
      const url = e.target.value.trim()
      const img = document.getElementById('profile-avatar')
      if (url) img.src = url
    })
    document.getElementById('profile-banner-url').addEventListener('input', e => {
      const url = e.target.value.trim()
      const img = document.getElementById('profile-banner')
      if (url) { img.src = url; img.classList.remove('hidden') } else { img.classList.add('hidden') }
    })
    document.getElementById('save-profile').addEventListener('click', async () => {
      const bio = document.getElementById('profile-bio').value
      const avatarInput = document.getElementById('profile-avatar-url').value.trim()
      const bannerInput = document.getElementById('profile-banner-url').value.trim()
      const msg = document.getElementById('profile-msg')
      try {
        const payload = { bio }
        if (avatarInput) payload.avatar = { url: avatarInput }
        if (bannerInput) payload.banner = { url: bannerInput }
        await apiUpdateProfile(user.name || profileName, payload)
        // refresh profile from server to sync credits/avatar/banner
        try {
          const fresh = await apiGetProfile(user.name || profileName, { _listings: true, _bids: true })
          const freshData = fresh.data || fresh
          setSession(getToken(), { ...getProfile(), ...freshData })
        } catch { }
        msg.textContent = 'Saved'
        msg.className = 'text-xs text-green-600'
      } catch (err) {
        msg.textContent = err.message || 'Save failed'
        msg.className = 'text-xs text-red-600'
      }
    })

    // Fetch listings and bids for tabs
    let myListings = []
    try { const r = await apiGetProfileListings(user.name || profileName, { _bids: true }); myListings = (r.data || r) } catch { }
    let myBids = []
    try {
      // attempt with plural embed param
      let r = await apiGetProfileBids(user.name || profileName, { _listings: true })
      myBids = (r.data || r)
      if (!Array.isArray(myBids) || myBids.length === 0) {
        // fallback to singular param for API variants
        r = await apiGetProfileBids(user.name || profileName, { _listing: true })
        myBids = (r.data || r)
      }
    } catch (e) {
      console.warn('Failed fetching bids first attempt', e)
      try {
        const r = await apiGetProfileBids(user.name || profileName, {})
        myBids = (r.data || r)
      } catch { }
    }

    if (!Array.isArray(myBids)) myBids = []

    // If listings not embedded, fetch missing listing details (limit to 10 to avoid overload)
    const missingListingIds = Array.from(new Set(myBids.filter(b => !b.listing && !b.listings?.length && (b.listingId || b.listingID || b.listing_id)).map(b => b.listingId || b.listingID || b.listing_id))).slice(0, 10)
    const fetchedMap = new Map()
    for (const lid of missingListingIds) {
      try { const res = await apiGetListing(lid, { _bids: true, _seller: true }); fetchedMap.set(lid, res.data || res) } catch { }
    }
    myBids.forEach(b => {
      if (!b.listing && fetchedMap.size) {
        const lid = b.listingId || b.listingID || b.listing_id
        if (lid && fetchedMap.has(lid)) b.listing = fetchedMap.get(lid)
      }
      if (!b.listing && b.listings?.length) b.listing = b.listings[0]
    })

    // Compute wins (listings ended where highest bidder is user)
    const now = Date.now()
    const winsMap = new Map()
    myBids.forEach(b => {
      const listing = b.listing
      if (!listing) return
      const ends = new Date(listing.endsAt || listing.deadline || listing.ends_at).getTime()
      if (isNaN(ends) || ends > now) return // not ended yet
      const highest = listing.bids?.length ? listing.bids.reduce((m, x) => x.amount > m.amount ? x : m, listing.bids[0]) : null
      if (highest && (highest.bidderName === user.name || highest.bidder?.name === user.name)) {
        winsMap.set(listing.id, listing)
      }
    })
    const wins = Array.from(winsMap.values())

    // Tab rendering
    const tabListings = document.getElementById('tab-listings')
    const tabBids = document.getElementById('tab-bids')
    const tabWins = document.getElementById('tab-wins')

    // inline actions now part of dedicated dashboard card component

    // My Listings tab content
    const createBtnWrap = document.createElement('div')
    createBtnWrap.className = 'flex justify-end'
    const createLink = document.createElement('a')
    createLink.href = '/listings/create/'
    createLink.className = 'inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[12px] px-4 py-2 shadow'
    createLink.textContent = 'New Listing'
    createBtnWrap.appendChild(createLink)
    tabListings.appendChild(createBtnWrap)
    if (myListings.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'text-sm text-gray-500'
      empty.textContent = 'No listings yet.'
      tabListings.appendChild(empty)
    } else {
      const listingsGrid = document.createElement('div')
      listingsGrid.className = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'
      tabListings.appendChild(listingsGrid)
      myListings.forEach(l => {
        const card = renderDashboardListingCard({ ...l, tags: l.tags || [] }, { onDelete: () => { /* Optionally refresh counts */ } })
        listingsGrid.appendChild(card)
      })
    }

    // My Bids tab content
    if (myBids.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'text-sm text-gray-500'
      empty.textContent = 'No bids placed.'
      tabBids.appendChild(empty)
    } else {
      const bidsListingsMap = new Map()
      myBids.forEach(b => { if (b.listing) bidsListingsMap.set(b.listing.id, b.listing) })
      if (bidsListingsMap.size === 0) {
        // Fallback raw bids (no listing objects)
        myBids.forEach(b => {
          const p = document.createElement('p')
          p.className = 'text-xs text-gray-600'
          p.innerHTML = `<a class="text-[var(--color-primary)] hover:underline" href="/listings/detail/?id=${b.listingId || b.listingID || b.listing_id || ''}">Listing ${b.listingId || b.listingID || b.listing_id || ''}</a> – Bid: <strong>${b.amount} cr</strong> at ${new Date(b.created).toLocaleString()}`
          tabBids.appendChild(p)
        })
      } else {
        const bidsGrid = document.createElement('div')
        bidsGrid.className = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'
        tabBids.appendChild(bidsGrid)
        Array.from(bidsListingsMap.values()).forEach(l => {
          const adapted = {
            id: l.id,
            title: l.title,
            description: l.description,
            tags: l.tags || [],
            media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
            deadline: l.endsAt || l.deadline,
            ownerName: l.seller?.name || l.profile?.name,
            highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
          }
          bidsGrid.appendChild(renderListingCard(adapted))
        })
      }
    }

    // Wins tab content
    if (wins.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'text-sm text-gray-500'
      empty.textContent = 'No wins yet.'
      tabWins.appendChild(empty)
    }
    const winsGrid = document.createElement('div')
    winsGrid.className = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'
    tabWins.appendChild(winsGrid)
    wins.forEach(l => {
      const adapted = {
        id: l.id,
        title: l.title,
        description: l.description,
        tags: l.tags || [],
        media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
        deadline: l.endsAt || l.deadline,
        ownerName: l.seller?.name || l.profile?.name,
        highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
      }
      winsGrid.appendChild(renderListingCard(adapted))
    })

    // Tab switching logic
    const tabButtons = document.querySelectorAll('.dash-tab')
    tabButtons.forEach(btn => btn.addEventListener('click', () => {
      const target = btn.dataset.tab
      tabButtons.forEach(b => {
        const active = b === btn
        b.classList.toggle('bg-[var(--color-primary)]', active)
        b.classList.toggle('text-white', active)
        b.classList.toggle('bg-gray-200', !active)
        b.setAttribute('aria-selected', active ? 'true' : 'false')
        // Ensure only non-active have hover background effect via utility classes
        if (!active) {
          b.classList.add('hover:bg-gray-300')
        } else {
          b.classList.remove('hover:bg-gray-300')
        }
      })
      document.querySelectorAll('#tab-panels > div').forEach(p => p.classList.add('hidden'))
      document.getElementById('tab-' + target).classList.remove('hidden')
    }))
  })()
}
