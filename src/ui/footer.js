import tpl from './footer.html?raw'
export function mountFooter(el) {
  el.innerHTML = tpl
  el.querySelector('#year').textContent = new Date().getFullYear()
}
