// Tiny hash router: #/discover, #/messages/m_123
import { useSyncExternalStore } from 'react'

const sub = (cb) => (window.addEventListener('hashchange', cb), () => window.removeEventListener('hashchange', cb))
const get = () => window.location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  const path = useSyncExternalStore(sub, get)
  const [, page = '', ...rest] = path.split('?')[0].split('/')
  const query = Object.fromEntries(new URLSearchParams(path.split('?')[1] || ''))
  return { path, page, params: rest, query }
}

export function navigate(to, { replace } = {}) {
  const url = `#${to}`
  if (replace) window.location.replace(url)
  else window.location.hash = to
  window.scrollTo({ top: 0 })
}
