import { boot } from '../../main/boot.js'
import { requireAuth } from '../../auth/guard.js'
import { apiGetListing, apiUpdateListing, apiDeleteListing } from '../../api/listings.api.js'
import { getToken, getProfile } from '../../auth/auth.js'

boot()

const canEdit = requireAuth()
if (canEdit) {
  ; (async () => {
    const params = new URLSearchParams(location.search)
    const id = params.get('id')
    let listing
    try { const res = await apiGetListing(id, { _bids: true, _seller: true }); listing = res.data || res } catch { }
    const form = document.getElementById('edit-form')
    const errorEl = document.getElementById('edit-error')
    const msg = document.getElementById('edit-msg')
    const currentProfileName = getProfile()?.name
    if (!getToken()) {
      errorEl.textContent = 'Login required.'
    } else if (!listing) {
      errorEl.textContent = 'Listing not found.'
    } else if (listing.seller?.name && listing.seller.name !== currentProfileName) {
      errorEl.textContent = 'You do not own this listing.'
    } else {
      form.classList.remove('hidden')
      form.title.value = listing.title
      form.description.value = listing.description || ''
      form.media.value = (listing.media || []).map(m => (typeof m === 'string' ? m : m.url)).join(', ')
      form.tags.value = (listing.tags || []).join(', ')
      const ends = listing.endsAt || listing.deadline
      if (ends) form.deadline.value = ends.slice(0, 16)
    }

    form?.addEventListener('submit', async e => {
      e.preventDefault()
      const fd = new FormData(form)
      const mediaRaw = fd.get('media') || ''
      const mediaArr = mediaRaw.split(',').map(s => s.trim()).filter(Boolean)
      const tags = (fd.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)
      try {
        await apiUpdateListing(id, { title: fd.get('title'), description: fd.get('description'), tags, media: mediaArr.map(url => ({ url })), endsAt: new Date(fd.get('deadline')).toISOString() })
        msg.textContent = 'Updated! Redirecting...'
        msg.className = 'text-sm text-green-600'
        setTimeout(() => { location.href = `/listings/detail/?id=${id}` }, 600)
      } catch (err) {
        msg.textContent = err.message || 'Update failed'
        msg.className = 'text-sm text-red-600'
      }
    })

    document.getElementById('delete-btn')?.addEventListener('click', async () => {
      if (confirm('Delete listing?')) {
        try {
          await apiDeleteListing(id)
          location.href = '/listings/'
        } catch (err) {
          msg.textContent = err.message || 'Delete failed'
          msg.className = 'text-sm text-red-600'
        }
      }
    })
  })()
}
