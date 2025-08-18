import tpl from './listingCard.html?raw'

let template
function ensureTemplate() {
  if (!template) {
    const div = document.createElement('div')
    div.innerHTML = tpl
    template = div.querySelector('template')
  }
  return template
}

export function renderListingCard(listing) {
  const t = ensureTemplate()
  const node = t.content.firstElementChild.cloneNode(true)
  node.href = `/listings/detail.html?id=${listing.id}`
  node.dataset.id = listing.id
  node.querySelector('[data-ref="title"]').textContent = listing.title
  node.querySelector('[data-ref="bids"]').textContent = listing.bids.length
  node.querySelector('[data-ref="highest"]').textContent = listing.highest
  node.querySelector('[data-ref="deadline"]').textContent = new Date(listing.deadline).toLocaleString()
  const img = node.querySelector('[data-ref="image"]')
  const noImg = node.querySelector('[data-ref="no-image"]')
  if (listing.media && listing.media.length) {
    img.src = listing.media[0]
    img.classList.remove('hidden')
    noImg.classList.add('hidden')
  }
  return node
}
