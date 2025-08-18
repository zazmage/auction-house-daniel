import { boot } from '../../main/boot.js'
import { getListing, placeBid, currentUser } from '../../mock/data.js'
import { getProfile } from '../../auth/auth.js'

boot()

const params = new URLSearchParams(location.search)
const id = params.get('id')
const listing = getListing(id)
const form = document.getElementById('bid-form')
const bidMsg = document.getElementById('bid-msg')

if (!listing) {
  document.getElementById('listing-detail').innerHTML = '<p>Listing not found.</p>'
} else {
  document.getElementById('detail-title').textContent = listing.title
  document.getElementById('detail-description').textContent = listing.description || 'No description.'
  document.getElementById('detail-deadline').textContent = new Date(listing.deadline).toLocaleString()
  document.getElementById('detail-owner').textContent = listing.ownerName
  document.getElementById('detail-highest').textContent = listing.highest
  const mediaWrap = document.getElementById('detail-media')
  listing.media.forEach(url => {
    const img = document.createElement('img')
    img.src = url
    img.alt = ''
    img.className = 'w-40 h-24 object-cover rounded'
    mediaWrap.appendChild(img)
  })
  const history = document.getElementById('bid-history')
  listing.bids.slice().reverse().forEach(b => {
    const li = document.createElement('li')
    li.textContent = `${b.amount} cr by ${b.userId} at ${new Date(b.created).toLocaleTimeString()}`
    history.appendChild(li)
  })
  const cu = getProfile() || currentUser()
  if (!cu || cu.id === listing.ownerId) form.classList.add('hidden')
}

form?.addEventListener('submit', e => {
  e.preventDefault()
  const fd = new FormData(form)
  const amt = Number(fd.get('amount'))
  const { listing: updated, error } = placeBid(id, amt)
  if (error) {
    bidMsg.textContent = error
    bidMsg.className = 'text-xs text-red-600'
  } else {
    bidMsg.textContent = 'Bid placed!'
    bidMsg.className = 'text-xs text-green-600'
    document.getElementById('detail-highest').textContent = updated.highest
  }
})
