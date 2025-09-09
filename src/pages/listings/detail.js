import { boot } from '../../main/boot.js'
import { getProfile, getToken, setSession } from '../../auth/auth.js'
import { apiGetListing, apiBidOnListing } from '../../api/listings.api.js'
import { apiGetProfile } from '../../api/profiles.api.js'

boot()

const params = new URLSearchParams(location.search)
const id = params.get('id')
let currentListing
let media = []
let currentIndex = 0
const form = document.getElementById('bid-form')
const bidMsg = document.getElementById('bid-msg')
const loginCta = document.getElementById('login-cta')

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
  // Main image + gallery setup
  media = listing.media
  const mainImg = document.getElementById('main-image')
  const noImage = document.getElementById('no-image')
  const gallery = document.getElementById('media-gallery')
  const gPrev = document.getElementById('gallery-prev')
  const gNext = document.getElementById('gallery-next')
  gallery.innerHTML = ''
  if (media.length) {
    currentIndex = 0
    mainImg.src = media[0]
    mainImg.classList.remove('hidden')
    noImage.classList.add('hidden')
    media.forEach((url, idx) => {
      const t = document.createElement('img')
      t.src = url
      t.alt = ''
      t.className = 'w-28 h-20 object-cover rounded cursor-pointer border border-transparent hover:border-[var(--color-primary)]'
      t.addEventListener('click', () => openModalAt(idx))
      gallery.appendChild(t)
    })
    const updateArrows = () => {
      const overflow = gallery.scrollWidth > gallery.clientWidth
      gPrev.classList.toggle('hidden', !overflow)
      gNext.classList.toggle('hidden', !overflow)
    }
    // defer to after paint
    setTimeout(updateArrows, 0)
    window.addEventListener('resize', updateArrows)
  } else {
    mainImg.classList.add('hidden')
    noImage.classList.remove('hidden')
  }
  const history = document.getElementById('bid-history')
  history.innerHTML = ''
  listing.bids.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).forEach(b => {
    const li = document.createElement('li')
    li.textContent = `${b.amount} cr by ${b.bidderName || b.userId || b.bidder?.name || 'Unknown'} at ${new Date(b.created).toLocaleTimeString()}`
    history.appendChild(li)
  })
  const cu = getProfile()
  // Visibility rules:
  // 1. Not logged in -> show login CTA, hide bid form
  // 2. Logged in & owner -> hide both (can't bid on own listing)
  // 3. Logged in & not owner -> show bid form, hide login CTA
  if (!cu) {
    form.classList.add('hidden')
    if (loginCta) {
      loginCta.classList.remove('hidden')
      loginCta.classList.add('flex')
    }
  } else if (cu.name === listing.ownerName) {
    form.classList.add('hidden')
    if (loginCta) loginCta.classList.add('hidden')
  } else {
    form.classList.remove('hidden')
    if (loginCta) loginCta.classList.add('hidden')
  }
}

// Modal viewer logic
const modal = document.getElementById('image-modal')
const modalImg = document.getElementById('modal-image')
const modalClose = document.getElementById('modal-close')
const modalPrev = document.getElementById('modal-prev')
const modalNext = document.getElementById('modal-next')
const modalDots = document.getElementById('modal-dots')
const mainImgEl = document.getElementById('main-image')

function openModalAt(idx = 0) {
  if (!media.length) return
  currentIndex = Math.max(0, Math.min(idx, media.length - 1))
  modalImg.src = media[currentIndex]
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  renderDots()
}
function closeModal() {
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}
function nextImg() {
  if (!media.length) return
  currentIndex = (currentIndex + 1) % media.length
  modalImg.src = media[currentIndex]
  updateDots()
}
function prevImg() {
  if (!media.length) return
  currentIndex = (currentIndex - 1 + media.length) % media.length
  modalImg.src = media[currentIndex]
  updateDots()
}

mainImgEl?.addEventListener('click', () => openModalAt(0))
modalClose?.addEventListener('click', closeModal)
modalNext?.addEventListener('click', nextImg)
modalPrev?.addEventListener('click', prevImg)
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal() })
document.addEventListener('keydown', (e) => {
  if (modal.classList.contains('hidden')) return
  if (e.key === 'Escape') closeModal()
  else if (e.key === 'ArrowRight') nextImg()
  else if (e.key === 'ArrowLeft') prevImg()
})

function renderDots() {
  if (!modalDots) return
  modalDots.innerHTML = ''
  media.forEach((_, i) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = 'w-2.5 h-2.5 rounded-full ' + (i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60')
    dot.addEventListener('click', () => {
      currentIndex = i
      modalImg.src = media[currentIndex]
      updateDots()
    })
    modalDots.appendChild(dot)
  })
}
function updateDots() {
  if (!modalDots) return
  const children = Array.from(modalDots.children)
  children.forEach((el, i) => {
    el.className = 'w-2.5 h-2.5 rounded-full ' + (i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60')
  })
}

form?.addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(form)
  const amt = Number(fd.get('amount'))
  try {
    await apiBidOnListing(id, amt)
    // After a successful bid, credits change on server; fetch own profile quietly to update header credits
    try {
      const current = getProfile()
      if (current?.name) {
        const fresh = await apiGetProfile(current.name)
        const data = fresh.data || fresh
        if (data?.credits != null) setSession(getToken(), { ...current, credits: data.credits })
      }
    } catch { /* ignore refresh errors */ }
    await load()
    bidMsg.textContent = 'Bid placed!'
    bidMsg.className = 'text-xs text-green-600'
  } catch (err) {
    bidMsg.textContent = (err.message === 'Not Found' ? 'Listing not found or no longer available' : err.message) || 'Failed to bid'
    bidMsg.className = 'text-xs text-red-600'
  }
})

load()
