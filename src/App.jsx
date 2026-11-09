import { useEffect } from 'react'
import { useRoute, navigate } from './lib/router'
import { currentUser, useDB, isConfigured } from './lib/db'
import { useToast } from './components/ui'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Discover } from './pages/Discover'
import { Matches } from './pages/Matches'
import { Messages } from './pages/Messages'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'

const APP_PAGES = { home: Dashboard, discover: Discover, matches: Matches, messages: Messages, profile: Profile, settings: Settings }

export default function App() {
  useDB()
  const toast = useToast()
  const route = useRoute()

  useEffect(() => {
    const onError = (e) => toast(e.detail)
    window.addEventListener('unigo:error', onError)
    return () => window.removeEventListener('unigo:error', onError)
  }, [toast])
  const me = currentUser()

  // Route guards: public pages vs. signed-in app vs. onboarding.
  let redirect = null
  if (APP_PAGES[route.page] || route.page === 'onboarding') {
    if (!me) redirect = '/login'
    else if (!me.onboarded && route.page !== 'onboarding') redirect = '/onboarding'
  } else if ((route.page === 'login' || route.page === 'signup') && me) {
    redirect = me.onboarded ? '/home' : '/onboarding'
  }

  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true })
  }, [redirect])

  if (redirect) return null
  if (!isConfigured && route.page !== '')
    return (
      <div className="center" style={{ minHeight: '100vh', padding: 24, textAlign: 'center' }}>
        <div className="card card-pad" style={{ maxWidth: 420 }}>
          <h2 style={{ fontSize: 20 }}>UniGO is being set up</h2>
          <p className="muted" style={{ marginTop: 8 }}>The database isn't connected yet. Please check back shortly.</p>
        </div>
      </div>
    )
  if (route.page === 'login' || route.page === 'signup') return <Auth mode={route.page} />
  if (route.page === 'onboarding') return <Onboarding />
  const Page = APP_PAGES[route.page]
  if (Page) return <Page route={route} />
  return <Landing />
}
