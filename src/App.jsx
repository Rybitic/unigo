import { useEffect } from 'react'
import { useRoute, navigate } from './lib/router'
import { currentUser, useDB } from './lib/db'
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
  const route = useRoute()
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
  if (route.page === 'login' || route.page === 'signup') return <Auth mode={route.page} />
  if (route.page === 'onboarding') return <Onboarding />
  const Page = APP_PAGES[route.page]
  if (Page) return <Page route={route} />
  return <Landing />
}
