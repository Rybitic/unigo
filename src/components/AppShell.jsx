import { Home, Compass, Heart, MessageCircle, User, Settings, Zap, LogOut, Bell } from 'lucide-react'
import { Avatar, Logo } from './ui'
import { currentUser, incomingLikes, logOut, totalUnread, useDB } from '../lib/db'
import { navigate } from '../lib/router'

const NAV = [
  { to: 'home', label: 'Home', icon: Home },
  { to: 'discover', label: 'Discover', icon: Compass },
  { to: 'matches', label: 'My Matches', short: 'Matches', icon: Heart },
  { to: 'messages', label: 'Messages', icon: MessageCircle },
  { to: 'profile', label: 'My Profile', short: 'Profile', icon: User },
  { to: 'settings', label: 'Settings', icon: Settings },
]

export function AppShell({ page, title, actions, children }) {
  useDB()
  const me = currentUser()
  const unread = totalUnread()
  const likes = incomingLikes().length
  const badge = (to) => (to === 'messages' ? unread : to === 'matches' ? likes : 0)

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo />
        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <a key={to} href={`#/${to}`} className={page === to ? 'active' : ''} title={label}>
              <Icon size={19} />
              <span className="lbl">{label}</span>
              {badge(to) > 0 && <span className="count">{badge(to)}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-cta">
          <div className="row" style={{ gap: 6, fontWeight: 700, position: 'relative' }}>
            <Zap size={16} fill="white" /> Swap streak
          </div>
          <p className="small" style={{ opacity: 0.9, margin: '6px 0 12px', position: 'relative' }}>
            Find someone new to learn from today.
          </p>
          <button className="btn btn-sm" style={{ background: 'white', color: 'var(--purple-600)', position: 'relative' }} onClick={() => navigate('/discover')}>
            Start swiping
          </button>
        </div>
        <div className="sidebar-user">
          <a href="#/profile">
            <Avatar user={me} size={38} online />
          </a>
          <div className="grow">
            <div className="small truncate" style={{ fontWeight: 600 }}>{me.name}</div>
            <div className="tiny subtle truncate">{me.email}</div>
          </div>
          <button className="icon-btn" title="Log out" onClick={async () => (await logOut(), navigate('/'))}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="row" style={{ gap: 12 }}>
            <span className="mobile-logo">
              <Logo size={30} text={false} />
            </span>
            <h1>{title}</h1>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {actions}
            <button className="icon-btn" style={{ position: 'relative' }} title="Likes & messages" onClick={() => navigate(likes ? '/matches?tab=likes' : '/messages')}>
              <Bell size={19} />
              {unread + likes > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 9, background: 'var(--red)', border: '2px solid var(--bg)' }} />}
            </button>
            <a href="#/profile" className="hide-mobile" style={{ marginLeft: 4 }}>
              <Avatar user={me} size={36} />
            </a>
          </div>
        </header>
        <div className="page" key={page}>{children}</div>
      </main>

      <nav className="mobile-nav">
        {NAV.filter((n) => n.to !== 'settings').map(({ to, label, short, icon: Icon }) => (
          <a key={to} href={`#/${to}`} className={page === to ? 'active' : ''}>
            <Icon size={21} strokeWidth={page === to ? 2.4 : 2} />
            {short || label}
            {badge(to) > 0 && <span className="count">{badge(to)}</span>}
          </a>
        ))}
      </nav>
    </div>
  )
}
