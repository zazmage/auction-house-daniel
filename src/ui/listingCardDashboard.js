import tpl from './listingCardDashboard.html?raw'
import { apiDeleteListing } from '../api/listings.api.js'

let template
function ensureTemplate() {
  if (!template) {
    const div = document.createElement('div')
    div.innerHTML = tpl
    template = div.querySelector('template')
  }
  return template
}

export function renderDashboardListingCard(listing, { onDelete } = {}) {
  const t = ensureTemplate()
  const root = t.content.firstElementChild.cloneNode(true)
  root.dataset.id = listing.id
  root.querySelector('[data-ref="title"]').textContent = listing.title
  root.querySelector('[data-ref="description"]').textContent = listing.description || ''
  if (listing.created) {
    const d = new Date(listing.created)
    root.querySelector('[data-ref="posted"]').textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const img = root.querySelector('[data-ref="image"]')
  const noImg = root.querySelector('[data-ref="no-image"]')
  if (listing.media?.length) {
    const first = listing.media[0]
    img.src = typeof first === 'string' ? first : first.url
    img.alt = typeof first === 'object' && first.alt ? first.alt : ''
    img.classList.remove('hidden')
    noImg.classList.add('hidden')
  }
  const bids = listing.bids || []
  const highest = bids.length ? Math.max(...bids.map(b => b.amount)) : 0
  root.querySelector('[data-ref="bids-badge"]').textContent = `${bids.length} bid${bids.length === 1 ? '' : 's'} • ${highest} cr`
  const endsEl = root.querySelector('[data-ref="ends"]')
  if (listing.endsAt || listing.deadline) {
    const ends = new Date(listing.endsAt || listing.deadline)
    endsEl.textContent = ends.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } else {
    endsEl.textContent = '—'
  }
  const tagsWrap = root.querySelector('[data-ref="tags"]')
    ; (listing.tags || []).slice(0, 8).forEach(tag => {
      const span = document.createElement('span')
      span.className = 'px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600'
      span.textContent = tag
      tagsWrap.appendChild(span)
    })
  const details = root.querySelector('[data-ref="details"]')
  const edit = root.querySelector('[data-ref="edit"]')
  const delBtn = root.querySelector('[data-ref="delete"]')
  details.href = `/listings/detail/?id=${listing.id}`
  edit.href = `/listings/edit/?id=${listing.id}`
  delBtn.addEventListener('click', async () => {
    if (!confirm('Delete this listing?')) return
    try {
      await apiDeleteListing(listing.id)
      root.remove()
      onDelete?.(listing.id)
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Error'))
    }
  })
  return root
}