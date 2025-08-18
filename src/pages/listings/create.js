import { boot } from '../../main/boot.js'
import { createListing, currentUser } from '../../mock/data.js'
import { requireAuth } from '../../auth/guard.js'
import { getProfile } from '../../auth/auth.js'

boot()

const canCreate = requireAuth()
if (canCreate) {
  document.getElementById('create-form')?.addEventListener('submit', e => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const media = (fd.get('media') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const { listing, error } = createListing({
      title: fd.get('title'),
      description: fd.get('description'),
      deadline: new Date(fd.get('deadline')).toISOString(),
      media,
    })
    const msg = document.getElementById('create-msg')
    if (error) {
      msg.textContent = error
      msg.className = 'text-sm text-red-600'
    } else {
      msg.textContent = 'Created! Redirecting...'
      msg.className = 'text-sm text-green-600'
      setTimeout(() => (location.href = `/listings/detail.html?id=${listing.id}`), 700)
    }
  })
}
