import { boot } from '../../main/boot.js'
import { currentUser, updateProfile, myListings, myBids } from '../../mock/data.js'
import { renderListingCard } from '../../ui/listingCard.js'
import { requireAuth } from '../../auth/guard.js'
import { getProfile } from '../../auth/auth.js'

boot()

const canProceed = requireAuth()
if (!canProceed) {
  // redirected by guard
} else {
  const user = getProfile() || currentUser()

  document.getElementById('profile-name').textContent = user.name
  document.getElementById('profile-email').textContent = user.email
  document.getElementById('profile-credits').textContent = user.credits
  document.getElementById('profile-avatar').src = user.avatar
  document.getElementById('profile-bio').value = user.bio || ''

  document.getElementById('save-profile').addEventListener('click', () => {
    const bio = document.getElementById('profile-bio').value
    const { error } = updateProfile({ bio })
    const msg = document.getElementById('profile-msg')
    if (error) {
      msg.textContent = error
      msg.className = 'text-xs text-red-600'
    } else {
      msg.textContent = 'Saved'
      msg.className = 'text-xs text-green-600'
    }
  })

  const mine = myListings()
  const mineWrap = document.getElementById('my-listings')
  if (mine.length === 0) document.getElementById('my-listings-empty').classList.remove('hidden')
  mine.forEach(l => mineWrap.appendChild(renderListingCard(l)))

  const bids = myBids()
  const bidsList = document.getElementById('my-bids')
  if (bids.length === 0) document.getElementById('my-bids-empty').classList.remove('hidden')
  bids.forEach(b => {
    const li = document.createElement('li')
    li.textContent = `${b.title} (highest: ${b.highest} cr)`
    bidsList.appendChild(li)
  })
}
