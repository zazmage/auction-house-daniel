import { boot } from '../../main/boot.js'
import { listListings, currentUser } from '../../mock/data.js'
import { renderListingCard } from '../../ui/listingCard.js'

boot()

const grid = document.getElementById('listings-grid')
const empty = document.getElementById('empty-state')
const form = document.getElementById('search-form')
const createLink = document.getElementById('create-link')
if (!currentUser()) createLink.classList.add('hidden')

function render(query) {
  grid.innerHTML = ''
  const items = listListings(query)
  if (items.length === 0) {
    empty.classList.remove('hidden')
  } else {
    empty.classList.add('hidden')
    items.forEach(l => grid.appendChild(renderListingCard(l)))
  }
}

render()

form?.addEventListener('submit', e => {
  e.preventDefault()
  const fd = new FormData(form)
  render(fd.get('q'))
})
