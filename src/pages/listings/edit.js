import { boot } from '../../main/boot.js'
import { getListing, updateListing, deleteListing, currentUser } from '../../mock/data.js'
import { requireAuth } from '../../auth/guard.js'

boot()

const canEdit = requireAuth()
if (canEdit) {
  const params = new URLSearchParams(location.search)
  const id = params.get('id')
  const listing = getListing(id)
  const form = document.getElementById('edit-form')
  const errorEl = document.getElementById('edit-error')
  const msg = document.getElementById('edit-msg')

  if (!currentUser()) {
    errorEl.textContent = 'Login required.'
  } else if (!listing) {
    errorEl.textContent = 'Listing not found.'
  } else if (listing.ownerId !== currentUser().id) {
    errorEl.textContent = 'You are not the owner.'
  } else {
    form.classList.remove('hidden')
    form.title.value = listing.title
    form.description.value = listing.description
    form.media.value = listing.media.join(', ')
    form.deadline.value = listing.deadline.slice(0, 16)
  }

  form?.addEventListener('submit', e => {
    e.preventDefault()
    const fd = new FormData(form)
    const media = (fd.get('media') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const { error } = updateListing(id, {
      title: fd.get('title'),
      description: fd.get('description'),
      media,
      deadline: new Date(fd.get('deadline')).toISOString(),
    })
    if (error) {
      msg.textContent = error
      msg.className = 'text-sm text-red-600'
    } else {
      msg.textContent = 'Updated!'
      msg.className = 'text-sm text-green-600'
    }
  })

  document.getElementById('delete-btn')?.addEventListener('click', () => {
    if (confirm('Delete listing?')) {
      const { error } = deleteListing(id)
      if (error) {
        msg.textContent = error
        msg.className = 'text-sm text-red-600'
      } else {
        location.href = '/listings/index.html'
      }
    }
  })
}
