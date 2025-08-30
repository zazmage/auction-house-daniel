import { boot } from '../../main/boot.js'
import { requireAuth } from '../../auth/guard.js'
import { getToken } from '../../auth/auth.js'
import { apiCreateListing } from '../../api/listings.api.js'

boot()

const canCreate = requireAuth()
if (canCreate) {
  const formEl = document.getElementById('create-form')
  formEl?.addEventListener('submit', async e => {
    e.preventDefault()
    const fd = new FormData(formEl)
    const mediaRaw = fd.get('media') || ''
    const mediaArr = mediaRaw.split(',').map(s => s.trim()).filter(Boolean)
    const tags = (fd.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)
    const msg = document.getElementById('create-msg')
    try {
      if (!getToken()) throw new Error('Not authenticated')
      const body = { title: fd.get('title'), description: fd.get('description'), tags, media: mediaArr.map(url => ({ url })), endsAt: new Date(fd.get('deadline')).toISOString() }
      const res = await apiCreateListing(body)
      const created = res.data || res
      const newId = created.id
      msg.textContent = 'Listing created successfully!'
      msg.className = 'text-sm text-green-600'
      alert('Listing created successfully!')
      try { formEl.reset() } catch { }
    } catch (err) {
      msg.textContent = err.message || 'Failed to create listing'
      msg.className = 'text-sm text-red-600'
    }
  })
}
