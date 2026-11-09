import { useState } from 'react'
import { Bell, Compass, Lock, Shield, Database, LogOut, Trash2, RotateCcw, HardDrive, Cloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Toggle, Modal, useToast } from '../components/ui'
import { getSettings, updateSettings, logOut, deleteAccount, currentUser, useDB, isLocalDemo } from '../lib/db'
import { navigate } from '../lib/router'

function Section({ icon: Icon, title, desc, children }) {
  return (
    <div className="card card-pad">
      <div className="row" style={{ gap: 12, marginBottom: 6 }}>
        <div className="stat-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple)', width: 38, height: 38, borderRadius: 11 }}><Icon size={18} /></div>
        <div>
          <div className="card-title">{title}</div>
          {desc && <div className="tiny muted">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Row({ title, desc, children }) {
  return (
    <div className="settings-row">
      <div>
        <div className="small" style={{ fontWeight: 600 }}>{title}</div>
        {desc && <div className="tiny muted">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export function Settings() {
  useDB()
  const me = currentUser()
  const s = getSettings()
  const toast = useToast()
  const [confirm, setConfirm] = useState(null)
  const t = (k) => (v) => (updateSettings({ [k]: v }), toast('Setting saved'))

  return (
    <AppShell page="settings" title="Settings">
      <div className="grid grid-2" style={{ alignItems: 'start', maxWidth: 1100 }}>
        <div className="col" style={{ gap: 20 }}>
          <Section icon={Compass} title="Discovery" desc="Control who you see and who sees you">
            <Row title="Show me on Discover" desc="Turn off to pause your profile"><Toggle on={s.discoverable} onChange={t('discoverable')} /></Row>
            <Row title="Two-way swaps first" desc="Rank reciprocal matches at the top"><Toggle on={s.reciprocalFirst} onChange={t('reciprocalFirst')} /></Row>
          </Section>

          <Section icon={Bell} title="Notifications">
            <Row title="New matches"><Toggle on={s.matchNotifs} onChange={t('matchNotifs')} /></Row>
            <Row title="New messages"><Toggle on={s.messageNotifs} onChange={t('messageNotifs')} /></Row>
            <Row title="Weekly email digest" desc="Your top recommended swaps"><Toggle on={s.emailNotifs} onChange={t('emailNotifs')} /></Row>
          </Section>

          <Section icon={Database} title="Data & storage">
            <Row title="Your data" desc="Account, profile, matches and messages">
              {isLocalDemo() ? <span className="badge badge-amber">Demo — not saved</span> : <span className="badge badge-green" style={{ gap: 6 }}><Cloud size={12} /> Saved to your account</span>}
            </Row>
            <div className="tiny muted" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, lineHeight: 1.6 }}>
              {isLocalDemo()
                ? 'You are exploring the demo account. Create your own account to save your profile, matches and messages.'
                : 'Everything is stored securely in the UniGO database, so you can log in with your email and password on any device and pick up where you left off.'}
            </div>
          </Section>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <Section icon={Lock} title="Account" desc={me.email}>
            <Row title="Email" desc="You log in with this email and your password">
              <span className="small" style={{ fontWeight: 600 }}>{me.email}</span>
            </Row>
          </Section>

          <Section icon={Shield} title="Safety & privacy">
            <Row title="Only matches can message me" desc="Always on — messaging requires a mutual like"><Toggle on onChange={() => toast('Messaging is always limited to mutual matches')} /></Row>
            <Row title="Community guidelines" desc="Be kind, be on time, teach honestly"><a className="link" href="#/" onClick={(e) => (e.preventDefault(), toast('Guidelines coming soon'))}>Read</a></Row>
          </Section>

          <div className="card card-pad col" style={{ gap: 10 }}>
            <button className="btn btn-secondary" onClick={async () => (await logOut(), navigate('/'))}><LogOut size={16} /> Log out</button>
            <button className="btn btn-danger" onClick={() => setConfirm('delete')}><Trash2 size={16} /> Delete account</button>
          </div>
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete your account?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                try {
                  await deleteAccount()
                  setConfirm(null)
                  navigate('/')
                  toast('Account deleted')
                } catch (err) {
                  setConfirm(null)
                  toast(err.message)
                }
              }}
            >
              Delete forever
            </button>
          </>
        }
      >
        <p className="muted">
          Your account, profile, matches, messages and sessions will be permanently removed. This can't be undone.
        </p>
      </Modal>
    </AppShell>
  )
}
