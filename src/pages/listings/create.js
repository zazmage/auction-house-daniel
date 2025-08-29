import { boot } from '../../main/boot.js'
import { requireAuth } from '../../auth/guard.js'
import { getToken } from '../../auth/auth.js'
import { apiCreateListing } from '../../api/listings.api.js'

boot()

const canCreate = requireAuth()
if (canCreate) {
  document.getElementById('create-form')?.addEventListener('submit', async e => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const media = (fd.get('media') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const msg = document.getElementById('create-msg')
    try {
      if (!getToken()) throw new Error('Not authenticated')
      const body = { title: fd.get('title'), description: fd.get('description'), media: media.map(url => ({ url })), endsAt: new Date(fd.get('deadline')).toISOString() }
      const res = await apiCreateListing(body)
      const created = res.data || res
      const newId = created.id
      msg.textContent = 'Created! Redirecting...'
      msg.className = 'text-sm text-green-600'
      setTimeout(() => (location.href = `/listings/detail.html?id=${newId}`), 700)
    } catch (err) {
      msg.textContent = err.message || 'Failed to create listing'
      msg.className = 'text-sm text-red-600'
    }
  })
}
