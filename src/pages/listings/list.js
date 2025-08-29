import { boot } from '../../main/boot.js'
import { renderListingCard } from '../../ui/listingCard.js'
import { apiListListings } from '../../api/listings.api.js'
import { getToken } from '../../auth/auth.js'

boot()

const grid = document.getElementById('listings-grid')
const empty = document.getElementById('empty-state')
const form = document.getElementById('search-form')
const createLink = document.getElementById('create-link')
if (!getToken()) createLink.classList.add('hidden')

async function render(query) {
  grid.innerHTML = ''
  empty.classList.add('hidden')
  let items = []
  try {
    const params = { limit: 50, _bids: true, sort: 'created', sortOrder: 'desc' }
    if (query) params.q = query
    const data = await apiListListings(params)
    items = data.data || data
  } catch (e) {
    empty.classList.remove('hidden')
    return
  }
  if (!items || items.length === 0) {
    empty.classList.remove('hidden')
    return
  }
  items.forEach(l => {
    // adapt API shape to card expectation if needed
    const adapted = {
      id: l.id,
      title: l.title,
      description: l.description,
      media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
      deadline: l.endsAt || l.deadline,
      ownerName: l.seller?.name || l.ownerName || l.profile?.name,
      highest: l._count?.bids ? (l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0) : l.highest || 0,
      bids: l.bids || [],
    }
    grid.appendChild(renderListingCard(adapted))
  })
}

render()

form?.addEventListener('submit', e => {
  e.preventDefault()
  const fd = new FormData(form)
  render(fd.get('q'))
})
