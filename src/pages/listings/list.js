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
let cache = [] // accumulated listings for current filters
let page = 1 // page-based pagination (Noroff API uses page + limit)
let totalAvailable = null // track total from API meta
let loading = false
let done = false
let appliedQuery = ''
let appliedTags = [] // lowercase
let appliedActiveOnly = false
let endMarkerAdded = false
const SERVER_PAGE_SIZE = 50 // server fetch batch size
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
      // intersection: every requested tag must exist in listing tags
      if (!appliedTags.every(t => lt.includes(t))) return false
    }
    if (appliedActiveOnly) {
      if (new Date(l.endsAt || l.deadline).getTime() <= now) return false
    }
    return true
  })
}

function renderNextChunk() {
  const already = document.querySelectorAll('[data-listing-card]').length
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
  if (already + nextSlice.length >= applyClientFilters(cache).length && done && !endMarkerAdded) {
    sentinel.classList.add('opacity-0')
    const endNote = document.createElement('p')
    endNote.className = 'text-center text-xs text-gray-500 mt-8'
    endNote.textContent = 'No more listings.'
    sentinel.parentElement.appendChild(endNote)
    endMarkerAdded = true
  }
}

async function fetchMoreIfNeeded() {
  if (loading || done) return
  // If we already have enough cached (not yet rendered visually), skip fetch
  const filtered = applyClientFilters(cache)
  const alreadyRendered = document.querySelectorAll('[data-listing-card]').length
  if (alreadyRendered < filtered.length) return
  if (totalAvailable != null && cache.length >= totalAvailable) { done = true; return }
  loading = true
  try {
    const baseParams = { limit: SERVER_PAGE_SIZE, page, _bids: true, _seller: true, sort: 'created', sortOrder: 'desc' }
    if (appliedActiveOnly) baseParams._active = true
    // Server only supports one _tag; if multiple selected we still send first to reduce payload
    if (appliedTags.length >= 1) baseParams._tag = appliedTags[0]
    const res = appliedQuery
      ? await apiSearchListings(appliedQuery, baseParams)
      : await apiListListings(baseParams)
    const meta = res.meta || res.data?.meta || null
    if (meta && meta.total != null) totalAvailable = meta.total
    // Some responses wrap list in data property, others may already be array
    let items = Array.isArray(res) ? res : (res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : (res.data || res)))
    if (!Array.isArray(items)) items = []
    // Deduplicate by id to prevent looping over first page again
    const existingIds = new Set(cache.map(i => i.id))
    const fresh = items.filter(i => !existingIds.has(i.id))
    if (!fresh.length) {
      done = true
    } else {
      cache = cache.concat(fresh)
      page += 1
    }
    if (totalAvailable != null && cache.length >= totalAvailable) done = true
  } catch (e) {
    console.warn('Listing fetch failed', e.message)
    done = true
  } finally {
    loading = false
  }
}

function updateUrlState() {
  const params = new URLSearchParams()
  if (appliedQuery) params.set('q', appliedQuery)
  if (appliedTags.length) params.set('tags', appliedTags.join(','))
  if (appliedActiveOnly) params.set('active', '1')
  const newUrl = location.pathname + (params.toString() ? '?' + params.toString() : '')
  history.replaceState(null, '', newUrl)
}

async function resetAndLoad(q = '', tagsArr = [], activeOnly = false) {
  appliedQuery = q
  appliedTags = tagsArr
  appliedActiveOnly = activeOnly
  page = 1
  totalAvailable = null
  cache = []
  done = false
  endMarkerAdded = false
  grid.innerHTML = ''
  if (secondaryGrid) { secondaryGrid.remove(); secondaryGrid = null }
  separatorSlot?.classList.add('hidden')
  empty.classList.add('hidden')
  updateUrlState()
  await fetchMoreIfNeeded()
  if (!cache.length) { empty.classList.remove('hidden'); return }
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

  // Initialize from URL (deep-linkable filters)
  ; (() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')?.trim() || ''
    const tags = (params.get('tags') || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const active = params.get('active') === '1'
    if (form) {
      if (q) form.q.value = q
      if (tags.length) form.tags.value = tags.join(', ')
      if (active) form.active.checked = true
    }
    resetAndLoad(q, tags, active)
  })()

// Debounced search submit to reduce rapid refetching
let searchDebounce
form?.addEventListener('submit', e => {
  e.preventDefault()
  const fd = new FormData(form)
  const q = (fd.get('q') || '').toString().trim()
  const tagsRaw = (fd.get('tags') || '').toString().trim()
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
  const activeOnly = fd.get('active') === 'on'
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => resetAndLoad(q, tags, activeOnly), 150)
})

clearBtn?.addEventListener('click', () => {
  if (!form) return
  form.q.value = ''
  form.tags.value = ''
  form.active.checked = false
  resetAndLoad()
})
