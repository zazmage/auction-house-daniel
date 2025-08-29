import { boot } from '../../main/boot.js'
// mock usage removed
import { renderListingCard } from '../../ui/listingCard.js'
import { requireAuth } from '../../auth/guard.js'
import { getProfile, getToken } from '../../auth/auth.js'
import { apiGetProfile, apiUpdateProfile, apiGetProfileListings, apiGetProfileBids } from '../../api/profiles.api.js'

boot()

const canProceed = requireAuth()
if (!canProceed) {
  // redirected by guard
} else {
  ; (async function init() {
    const token = getToken(); if (!token) return
    let user
    try { const res = await apiGetProfile(getProfile()?.name || '', { _listings: true, _bids: true }); user = res.data || res } catch { }
    document.getElementById('profile-name').textContent = user.name
    document.getElementById('profile-email').textContent = user.email || user.email
    document.getElementById('profile-credits').textContent = user.credits
    if (user.avatar) document.getElementById('profile-avatar').src = user.avatar
    document.getElementById('profile-bio').value = user.bio || ''

    document.getElementById('save-profile').addEventListener('click', async () => {
      const bio = document.getElementById('profile-bio').value
      const msg = document.getElementById('profile-msg')
      try {
        await apiUpdateProfile(user.name, { bio })
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
    try { const r = await apiGetProfileListings(user.name, { _bids: true }); mine = (r.data || r) } catch { }
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
    try { const r = await apiGetProfileBids(user.name, { _listing: true }); bids = (r.data || r) } catch { }
    if (bids.length === 0) document.getElementById('my-bids-empty').classList.remove('hidden')
    bids.forEach(b => {
      const title = b.listing?.title || b.title || 'Listing'
      const highest = b.listing?.bids?.length ? Math.max(...b.listing.bids.map(x => x.amount)) : b.highest || 0
      const li = document.createElement('li')
      li.textContent = `${title} (highest: ${highest} cr)`
      bidsList.appendChild(li)
    })
  })()
}
