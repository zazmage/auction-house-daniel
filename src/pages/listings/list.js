import { boot } from '../../main/boot.js'
import { renderListingCard } from '../../ui/listingCard.js'
import { apiListListings, apiSearchListings } from '../../api/listings.api.js'
import { getToken } from '../../auth/auth.js'

boot()


const grid = document.getElementById('listings-grid')
const empty = document.getElementById('empty-state')
const form = document.getElementById('search-form')
const createLink = document.getElementById('create-link')
const clearBtn = document.getElementById('clear-filters')
const separatorSlot = document.getElementById('separator-slot')
const sentinel = document.getElementById('infinite-sentinel')
let secondaryGrid // added for post-separator listings
if (!getToken()) createLink.classList.add('hidden')

// State
let cache = [] // full fetched so far for current filters
let page = 1 // Noroff API pages are 1-based
let loading = false
let done = false
let appliedQuery = ''
let appliedTags = []
let appliedActiveOnly = false
const SERVER_PAGE_SIZE = 50 // server fetch batch (max default 100 allowed; 50 keeps payload reasonable)
const VISUAL_CHUNK = 12 // show 12 per scroll cycle (6 + separator + 6)

function adapt(l) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    tags: l.tags || [],
    media: (l.media || []).map(m => (typeof m === 'string' ? m : m.url)).filter(Boolean),
    deadline: l.endsAt || l.deadline,
    ownerName: l.seller?.name || l.ownerName || l.profile?.name,
    highest: l.bids?.length ? Math.max(...l.bids.map(b => b.amount)) : 0,
    bids: l.bids || [],
  }
}

function applyClientFilters(items) {
  const now = Date.now()
  return items.filter(l => {
    if (appliedTags.length) {
      const lt = (l.tags || []).map(t => t.toLowerCase())
      if (!appliedTags.every(t => lt.includes(t))) return false
    }
    if (appliedActiveOnly) {
      if (new Date(l.endsAt || l.deadline).getTime() <= now) return false
    }
    return true
  })
}

function renderNextChunk() {
  const already = grid.querySelectorAll('[data-listing-card]').length
  // Determine which slice to show next
  const filtered = applyClientFilters(cache)
  if (already >= filtered.length) return
  const nextSlice = filtered.slice(already, already + VISUAL_CHUNK)
  if (nextSlice.length === 0) return
  // Insert first 6, then separator (if not shown yet), then remaining 6
  nextSlice.forEach((l, idx) => {
    // Show separator after first 6 cards overall (not per batch) if not shown
    const totalBefore = already + idx
    if (totalBefore === 6 && separatorSlot && separatorSlot.classList.contains('hidden')) {
      separatorSlot.classList.remove('hidden')
      // create secondary grid just after separator
      secondaryGrid = document.createElement('div')
      secondaryGrid.id = 'listings-grid-2'
      secondaryGrid.className = 'grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3'
      grid.parentElement.insertBefore(separatorSlot, sentinel)
      grid.parentElement.insertBefore(secondaryGrid, sentinel)
    }
    const card = renderListingCard(adapt(l))
    card.setAttribute('data-listing-card', '1')
    // If separator exists and has been inserted and we are past 6, ensure it visually separates
    if (secondaryGrid && totalBefore >= 6) {
      secondaryGrid.appendChild(card)
    } else {
      grid.appendChild(card)
    }
  })
  if (already + nextSlice.length >= applyClientFilters(cache).length && done) {
    // All displayed
    sentinel.classList.add('opacity-0')
  }
}

async function fetchMoreIfNeeded() {
  if (loading || done) return
  // If we already have enough cached to render another chunk, skip fetch
  const filtered = applyClientFilters(cache)
  const already = grid.querySelectorAll('[data-listing-card]').length
  if (already < filtered.length) return
  loading = true
  try {
    const baseParams = { limit: SERVER_PAGE_SIZE, _bids: true, sort: 'created', sortOrder: 'desc', page }
    // API supports _active and _tag for filtering; use them so server returns leaner dataset
    if (appliedActiveOnly) baseParams._active = true
    if (appliedTags.length === 1) baseParams._tag = appliedTags[0] // only one supported by API
    // When query present, use search endpoint; it returns same shape (data + meta)
    const data = appliedQuery
      ? await apiSearchListings(appliedQuery, baseParams)
      : await apiListListings(baseParams)
    const items = (data.data || data) || []
    if (items.length === 0) {
      done = true
    } else {
      cache = cache.concat(items)
      page += 1
    }
  } catch (e) {
    console.warn('Listing fetch failed', e.message)
    done = true
  } finally {
    loading = false
  }
}

async function resetAndLoad(q = '', tagsArr = [], activeOnly = false) {
  appliedQuery = q
  appliedTags = tagsArr
  appliedActiveOnly = activeOnly
  page = 1
  cache = []
  done = false
  grid.innerHTML = ''
  separatorSlot?.classList.add('hidden')
  empty.classList.add('hidden')
  await fetchMoreIfNeeded()
  if (cache.length === 0) { empty.classList.remove('hidden'); return }
  renderNextChunk()
}

// Intersection Observer for infinite scroll
const io = new IntersectionObserver(async (entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      await fetchMoreIfNeeded()
      renderNextChunk()
    }
  }
}, { rootMargin: '200px' })
if (sentinel) io.observe(sentinel)

resetAndLoad()

form?.addEventListener('submit', e => {
  e.preventDefault()
  const fd = new FormData(form)
  const q = fd.get('q')?.trim()
  const tagsRaw = fd.get('tags')?.trim() || ''
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
  const activeOnly = fd.get('active') === 'on'
  resetAndLoad(q, tags, activeOnly)
})

clearBtn?.addEventListener('click', () => {
  form.q.value = ''
  form.tags.value = ''
  form.active.checked = false
  resetAndLoad()
})
