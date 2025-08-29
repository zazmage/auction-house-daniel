import { boot } from '../../main/boot.js'
import { getProfile, getToken } from '../../auth/auth.js'
import { apiGetListing, apiBidOnListing } from '../../api/listings.api.js'

boot()

const params = new URLSearchParams(location.search)
const id = params.get('id')
let currentListing
const form = document.getElementById('bid-form')
const bidMsg = document.getElementById('bid-msg')

async function load() {
  document.getElementById('listing-detail').classList.add('opacity-50')
  try {
    const data = await apiGetListing(id, { _bids: true, _seller: true })
    currentListing = data.data || data
  } catch (e) {
    console.error(e)
    currentListing = null
  }
  render()
}

function adapt(listing) {
  if (!listing) return null
  if (listing.ownerName) return listing
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    deadline: listing.endsAt || listing.deadline,
    media: (listing.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
    ownerId: listing.seller?.name || listing.profile?.name,
    ownerName: listing.seller?.name || listing.profile?.name,
    bids: listing.bids || [],
    highest: listing.bids?.length ? Math.max(...listing.bids.map(b => b.amount)) : 0,
  }
}

function render() {
  document.getElementById('listing-detail').classList.remove('opacity-50')
  const listing = adapt(currentListing)
  if (!listing) {
    document.getElementById('listing-detail').innerHTML = '<p>Listing not found.</p>'
    return
  }
  document.getElementById('detail-title').textContent = listing.title
  document.getElementById('detail-description').textContent = listing.description || 'No description.'
  document.getElementById('detail-deadline').textContent = new Date(listing.deadline).toLocaleString()
  document.getElementById('detail-owner').textContent = listing.ownerName
  document.getElementById('detail-highest').textContent = listing.highest
  const mediaWrap = document.getElementById('detail-media')
  mediaWrap.innerHTML = ''
  listing.media.forEach(url => {
    const img = document.createElement('img')
    img.src = url
    img.alt = ''
    img.className = 'w-40 h-24 object-cover rounded'
    mediaWrap.appendChild(img)
  })
  const history = document.getElementById('bid-history')
  history.innerHTML = ''
  listing.bids.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).forEach(b => {
    const li = document.createElement('li')
    li.textContent = `${b.amount} cr by ${b.bidderName || b.userId || b.bidder?.name || 'Unknown'} at ${new Date(b.created).toLocaleTimeString()}`
    history.appendChild(li)
  })
  const cu = getProfile()
  if (!cu || cu.name === listing.ownerName) form.classList.add('hidden')
  else form.classList.remove('hidden')
}

form?.addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(form)
  const amt = Number(fd.get('amount'))
  try {
    await apiBidOnListing(id, amt)
    await load()
    bidMsg.textContent = 'Bid placed!'
    bidMsg.className = 'text-xs text-green-600'
  } catch (err) {
    bidMsg.textContent = (err.message === 'Not Found' ? 'Listing not found or no longer available' : err.message) || 'Failed to bid'
    bidMsg.className = 'text-xs text-red-600'
  }
})

load()
