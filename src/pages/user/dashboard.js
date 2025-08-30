import { boot } from '../../main/boot.js'
// mock usage removed
import { renderListingCard } from '../../ui/listingCard.js'
import { requireAuth } from '../../auth/guard.js'
import { getProfile, getToken, setSession } from '../../auth/auth.js'
import { apiGetProfile, apiUpdateProfile, apiGetProfileListings, apiGetProfileBids } from '../../api/profiles.api.js'

boot()

const canProceed = requireAuth()
if (!canProceed) {
  // redirected by guard
} else {
  ; (async function init() {
    const token = getToken(); if (!token) return
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
      const bPrevWrap = document.getElementById('profile-banner-preview')
      const bEl = document.getElementById('profile-banner')
      bEl.src = bannerUrl
      bPrevWrap.classList.remove('hidden')
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
      const wrap = document.getElementById('profile-banner-preview')
      const img = document.getElementById('profile-banner')
      if (url) { img.src = url; wrap.classList.remove('hidden') } else { wrap.classList.add('hidden') }
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

    // Listings created
    const mineWrap = document.getElementById('my-listings')
    let mine = []
    try { const r = await apiGetProfileListings(user.name || profileName, { _bids: true }); mine = (r.data || r) } catch { }
    if (mine.length === 0) document.getElementById('my-listings-empty').classList.remove('hidden')
    mine.forEach(l => {
      const adapted = {
        id: l.id,
        title: l.title,
        description: l.description,
        media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
        deadline: l.endsAt || l.deadline,
        ownerName: user.name,
        highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
      }
      mineWrap.appendChild(renderListingCard(adapted))
    })

    // Bids made
    const bidsList = document.getElementById('my-bids')
    let bids = []
    try { const r = await apiGetProfileBids(user.name || profileName, { _listing: true }); bids = (r.data || r) } catch { }
    if (bids.length === 0) document.getElementById('my-bids-empty').classList.remove('hidden')
    bids.forEach(b => {
      const title = b.listing?.title || b.title || 'Listing'
      const highest = b.listing?.bids?.length ? Math.max(...b.listing.bids.map(x => x.amount)) : b.highest || 0
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = `/listings/detail.html?id=${b.listing?.id || b.listingId || b.id}`
      a.className = 'text-blue-600 hover:underline'
      a.textContent = `${title} (highest: ${highest} cr)`
      li.appendChild(a)
      bidsList.appendChild(li)
    })
  })()
}
