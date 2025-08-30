import tpl from './listingCard.html?raw'
import { getProfile } from '../auth/auth.js'

let template
function ensureTemplate() {
  if (!template) {
    const div = document.createElement('div')
    div.innerHTML = tpl
    template = div.querySelector('template')
  }
  return template
}

export function renderListingCard(listing) {
  const t = ensureTemplate()
  const root = t.content.firstElementChild.cloneNode(true)
  root.dataset.id = listing.id
  const link = root.querySelector('[data-ref="details-link"]')
  link.href = `/listings/detail/?id=${listing.id}`
  // Title & description
  root.querySelector('[data-ref="title"]').textContent = listing.title
  root.querySelector('[data-ref="description"]').textContent = listing.description || ''
  // Seller & tags
  const seller = listing.ownerName || listing.seller?.name || 'Unknown'
  root.querySelector('[data-ref="seller"]').textContent = 'By ' + seller
  const tagsWrap = root.querySelector('[data-ref="tags"]')
  tagsWrap.innerHTML = ''
  const allTags = (listing.tags || []).filter(Boolean)
  const DISPLAY_LIMIT = 6
  allTags.slice(0, DISPLAY_LIMIT).forEach(tag => {
    const span = document.createElement('span')
    span.className = 'px-2 py-0.5 bg-[var(--color-primary-light)]/20 text-[10px] font-medium text-[var(--color-primary)] rounded-full border border-[var(--color-primary-light)]'
    span.textContent = tag
    tagsWrap.appendChild(span)
  })
  if (allTags.length > DISPLAY_LIMIT) {
    const more = document.createElement('span')
    more.className = 'px-2 py-0.5 bg-gray-200 text-[10px] font-medium text-gray-600 rounded-full'
    more.textContent = `+${allTags.length - DISPLAY_LIMIT}`
    tagsWrap.appendChild(more)
  }
  // Posted date
  if (listing.created) {
    const d = new Date(listing.created)
    root.querySelector('[data-ref="posted"]').textContent = 'Posted ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  // Image
  const img = root.querySelector('[data-ref="image"]')
  const noImg = root.querySelector('[data-ref="no-image"]')
  if (listing.media && listing.media.length) {
    const first = listing.media[0]
    img.src = typeof first === 'string' ? first : first.url
    img.alt = (typeof first === 'object' && first.alt) ? first.alt : ''
    img.classList.remove('hidden')
    noImg.classList.add('hidden')
  }
  // Bids badges
  const bids = Array.isArray(listing.bids) ? listing.bids : []
  const bidsCount = bids.length || listing._count?.bids || 0
  root.querySelector('[data-ref="bids-badge"]').textContent = bidsCount + ' bid' + (bidsCount === 1 ? '' : 's')
  const highest = bids.length ? Math.max(...bids.map(b => b.amount)) : (listing.highest || 0)
  root.querySelector('[data-ref="credits-badge"]').textContent = highest + ' credits'
  // Deadline & remaining time
  const endsAt = new Date(listing.deadline || listing.endsAt)
  const now = Date.now()
  root.querySelector('[data-ref="ends-line1"]').textContent = 'Ends: ' + endsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const diffMs = endsAt.getTime() - now
  let remaining = ''
  if (diffMs <= 0) remaining = 'ended'
  else {
    const days = Math.floor(diffMs / 86400000)
    if (days >= 1) remaining = 'in ' + days + ' day' + (days === 1 ? '' : 's')
    else {
      const hours = Math.floor(diffMs / 3600000)
      if (hours >= 1) remaining = 'in ' + hours + 'h'
      else {
        const mins = Math.floor(diffMs / 60000)
        remaining = mins <= 1 ? 'in 1 min' : 'in ' + mins + ' mins'
      }
    }
  }
  root.querySelector('[data-ref="ends-line2"]').textContent = remaining
  // Recent bids list (latest 3)
  const recentWrap = root.querySelector('[data-ref="recent-bids"]')
  const noBids = root.querySelector('[data-ref="no-bids"]')
  if (bids.length) {
    noBids.classList.add('hidden')
    bids.slice(-3).reverse().forEach(b => {
      const li = document.createElement('li')
      li.textContent = `${b.amount} cr by ${b.bidder?.name || 'Anon'}`
      recentWrap.appendChild(li)
    })
  }
  // Login prompt visibility
  const profile = getProfile()
  if (!profile || profile.name === seller) {
    const lp = root.querySelector('[data-ref="login-prompt"]')
    lp.classList.remove('hidden')
    lp.classList.add('flex')
  }
  return root
}
