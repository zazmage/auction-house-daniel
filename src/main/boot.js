import { mountHeader } from '../ui/header.js'
import { mountFooter } from '../ui/footer.js'

export function boot() {
  const headerEl = document.getElementById('site-header')
  const footerEl = document.getElementById('site-footer')
  if (headerEl) mountHeader(headerEl)
  if (footerEl) mountFooter(footerEl)
}
