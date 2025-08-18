import { boot } from '../main/boot.js'
import { listListings } from '../mock/data.js'
import { renderListingCard } from '../ui/listingCard.js'

boot()

const container = document.getElementById('featured-listings')
listListings().slice(0, 3).forEach(l => container.appendChild(renderListingCard(l)))
