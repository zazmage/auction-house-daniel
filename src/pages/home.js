import { boot } from '../main/boot.js'
import { renderListingCard } from '../ui/listingCard.js'
import { apiListListings } from '../api/listings.api.js'

boot()

const container = document.getElementById('featured-listings')
  ; (async () => {
    try {
      const data = await apiListListings({ limit: 3, sort: 'created', sortOrder: 'desc', _bids: true })
      const items = data.data || data
      items.forEach(l => {
        const adapted = {
          id: l.id,
          title: l.title,
          description: l.description,
          media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
          deadline: l.endsAt || l.deadline,
          ownerName: l.seller?.name || l.profile?.name,
          highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
        }
        container.appendChild(renderListingCard(adapted))
      })
    } catch (e) {
      container.innerHTML = '<p class="text-sm text-red-600">Failed to load listings.</p>'
    }
  })()
