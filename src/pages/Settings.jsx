import { useState } from 'react'
import { Bell, Compass, Lock, Shield, Database, LogOut, Trash2, RotateCcw, HardDrive, Cloud } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Toggle, Modal, useToast } from '../components/ui'
import { getSettings, updateSettings, changePassword, logOut, deleteAccount, resetDemo, currentUser, useDB } from '../lib/db'
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
  const [pw, setPw] = useState({ old: '', next: '' })
  const [pwErr, setPwErr] = useState('')
  const [confirm, setConfirm] = useState(null)
  const t = (k) => (v) => (updateSettings({ [k]: v }), toast('Setting saved'))

  const submitPw = async (e) => {
    e.preventDefault()
    setPwErr('')
    try {
      await changePassword(pw.old, pw.next)
      setPw({ old: '', next: '' })
      toast('Password updated')
    } catch (err) {
      setPwErr(err.message)
    }
  }

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
            <Row title="Backend" desc="Where your account and messages are stored">
              <span className="badge badge-amber" style={{ gap: 6 }}><HardDrive size={12} /> Local demo mode</span>
            </Row>
            <div className="tiny muted" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, lineHeight: 1.6 }}>
              <Cloud size={13} style={{ verticalAlign: -2 }} /> Data is saved in this browser's localStorage. Open a second tab, sign in as another account, and chat in real time. See <code>README.md</code> for connecting Supabase.
            </div>
            <Row title="Reset demo data" desc="Restore sample users and chats (accounts are kept)">
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirm('reset')}><RotateCcw size={14} /> Reset</button>
            </Row>
          </Section>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <Section icon={Lock} title="Account" desc={me.email}>
            <form onSubmit={submitPw} className="col" style={{ gap: 12, marginTop: 14 }}>
              {pwErr && <div className="form-error">{pwErr}</div>}
              <div className="field"><label className="label">Current password</label><input type="password" className="input" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} autoComplete="current-password" /></div>
              <div className="field"><label className="label">New password</label><input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></div>
              <button className="btn btn-secondary" disabled={!pw.old || !pw.next} style={{ alignSelf: 'flex-start' }}>Update password</button>
            </form>
          </Section>

          <Section icon={Shield} title="Safety & privacy">
            <Row title="Only matches can message me" desc="Always on — messaging requires a mutual like"><Toggle on onChange={() => toast('Messaging is always limited to mutual matches')} /></Row>
            <Row title="Community guidelines" desc="Be kind, be on time, teach honestly"><a className="link" href="#/" onClick={(e) => (e.preventDefault(), toast('Guidelines coming soon'))}>Read</a></Row>
          </Section>

          <div className="card card-pad col" style={{ gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => (logOut(), navigate('/'))}><LogOut size={16} /> Log out</button>
            <button className="btn btn-danger" onClick={() => setConfirm('delete')}><Trash2 size={16} /> Delete account</button>
          </div>
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Delete your account?' : 'Reset demo data?'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (confirm === 'delete') deleteAccount()
                else await resetDemo()
                setConfirm(null)
                navigate('/')
                toast(confirm === 'delete' ? 'Account deleted' : 'Demo data restored')
              }}
            >
              {confirm === 'delete' ? 'Delete forever' : 'Reset everything'}
            </button>
          </>
        }
      >
        <p className="muted">
          {confirm === 'delete'
            ? 'Your profile, matches, messages and sessions will be permanently removed.'
            : 'This restores the original sample community and clears matches, chats and sessions. Registered accounts and their profiles are kept, so everyone can still sign back in. You will be logged out.'}
        </p>
      </Modal>
    </AppShell>
  )
}
