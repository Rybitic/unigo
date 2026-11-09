import { useEffect, useRef, useState } from 'react'
import { Camera, MapPin, GraduationCap, Monitor, Pencil, Save, MessageCircle, Users, BookOpen, Award, CalendarDays, Clock, CheckCircle2, Check } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Avatar, SkillChip, ScoreRing, Empty, useToast, firstName } from '../components/ui'
import { SkillEditor } from '../components/SkillEditor'
import { currentUser, updateProfile, myMatches, mySessions, learningProgress, profileCompletion, useDB } from '../lib/db'
import { computeMatch } from '../lib/matching'
import { DAYS, TIMES, INTERESTS, FORMATS } from '../lib/skills'
import { fileToAvatar } from '../lib/image'
import { navigate } from '../lib/router'

const TABS = [
  { k: 'details', label: 'Details', icon: Pencil },
  { k: 'skills', label: 'Skills', icon: Award },
  { k: 'availability', label: 'Availability', icon: CalendarDays },
  { k: 'connections', label: 'Connections', icon: Users },
  { k: 'progress', label: 'Learning progress', icon: BookOpen },
]

export function Profile({ route }) {
  useDB()
  const me = currentUser()
  const toast = useToast()
  const [tab, setTab] = useState(route.query.tab || 'details')
  useEffect(() => {
    if (route.query.tab) setTab(route.query.tab)
  }, [route.query.tab])
  const [draft, setDraft] = useState(me)
  const fileRef = useRef()
  useEffect(() => setDraft(me), [me.id])

  // Only the editable fields; reads/settings change in the background.
  const editable = ({ reads, settings, avatar, ...rest }) => rest
  const dirty = JSON.stringify(editable(draft)) !== JSON.stringify(editable(me))
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const save = () => {
    if (!draft.name.trim()) return toast('Name cannot be empty')
    if (!draft.teach.length || !draft.learn.length) return toast('Keep at least one skill to teach and one to learn')
    updateProfile(editable(draft))
    toast('Profile saved')
  }

  const upload = async (e) => {
    try {
      const avatar = await fileToAvatar(e.target.files[0])
      updateProfile({ avatar })
      setDraft((d) => ({ ...d, avatar }))
      toast('Photo updated')
    } catch (err) {
      toast(err.message)
    }
  }

  const matches = myMatches()
  const sessions = mySessions()
  const progress = learningProgress()
  const completion = profileCompletion(me)
  const hours = (m) => Math.round((m / 60) * 10) / 10

  return (
    <AppShell page="profile" title="My Profile" actions={dirty && <button className="btn btn-primary btn-sm" onClick={save}><Save size={15} /> Save changes</button>}>
      <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div className="profile-cover" style={{ borderRadius: 0 }} />
        <div className="profile-head">
          <div style={{ position: 'relative' }}>
            <Avatar user={me} size={112} className="avatar-ring" />
            <button className="icon-btn" onClick={() => fileRef.current.click()} style={{ position: 'absolute', bottom: 2, right: 2, background: 'white', boxShadow: 'var(--shadow-md)', width: 34, height: 34, borderRadius: 99 }} title="Change photo">
              <Camera size={16} />
            </button>
            <input type="file" accept="image/*" hidden ref={fileRef} onChange={upload} />
          </div>
          <div className="grow" style={{ paddingBottom: 6, minWidth: 220 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{me.name}</h2>
            <div className="muted">{me.headline}</div>
            <div className="row wrap small muted" style={{ gap: 14, marginTop: 6 }}>
              {me.location.city && <span className="row" style={{ gap: 4 }}><MapPin size={14} /> {me.location.city}</span>}
              {me.university && <span className="row" style={{ gap: 4 }}><GraduationCap size={14} /> {me.university}</span>}
              <span className="row" style={{ gap: 4 }}><Monitor size={14} /> {FORMATS[me.format]}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 22, paddingBottom: 6 }}>
            {[['Matches', matches.length], ['Sessions', sessions.filter((s) => s.status === 'completed').length], ['Profile', `${completion.pct}%`]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.03em' }}>{v}</div>
                <div className="tiny muted">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.k} className={tab === t.k ? 'active' : ''} onClick={() => setTab(t.k)}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="card card-pad" style={{ maxWidth: 820 }}>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="field"><label className="label">Full name</label><input className="input" value={draft.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="field"><label className="label">Headline</label><input className="input" value={draft.headline} onChange={(e) => set('headline', e.target.value)} placeholder="e.g. CS student · aspiring founder" /></div>
            <div className="field"><label className="label">University or workplace</label><input className="input" value={draft.university} onChange={(e) => set('university', e.target.value)} /></div>
            <div className="field"><label className="label">Email</label><input className="input" value={me.email} disabled style={{ background: 'var(--surface-2)' }} /></div>
            <div className="field"><label className="label">City</label><input className="input" value={draft.location.city} onChange={(e) => set('location', { ...draft.location, city: e.target.value })} /></div>
            <div className="field"><label className="label">Country</label><input className="input" value={draft.location.country} onChange={(e) => set('location', { ...draft.location, country: e.target.value })} /></div>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">Bio</label>
            <textarea className="textarea" maxLength={280} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
            <span className="hint" style={{ textAlign: 'right' }}>{draft.bio.length}/280</span>
          </div>
          <div className="label" style={{ marginTop: 10, marginBottom: 8 }}>Interests</div>
          <div className="pill-select">
            {INTERESTS.map((t) => <button key={t} className={`pill-opt ${draft.interests.includes(t) ? 'active' : ''}`} onClick={() => set('interests', toggle(draft.interests, t))}>{t}</button>)}
          </div>
          <SaveBar dirty={dirty} onSave={save} onReset={() => setDraft(me)} />
        </div>
      )}

      {tab === 'skills' && (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card card-pad">
            <div className="card-title">Skills I can teach</div>
            <p className="small muted" style={{ margin: '4px 0 16px' }}>Your level shows how well you could teach each one.</p>
            <SkillEditor kind="teach" value={draft.teach} onChange={(v) => set('teach', v)} />
          </div>
          <div className="card card-pad">
            <div className="card-title">Skills I want to learn</div>
            <p className="small muted" style={{ margin: '4px 0 16px' }}>Your level is where you are today.</p>
            <SkillEditor kind="learn" value={draft.learn} onChange={(v) => set('learn', v)} exclude={draft.teach.map((s) => s.skill)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}><SaveBar dirty={dirty} onSave={save} onReset={() => setDraft(me)} /></div>
        </div>
      )}

      {tab === 'availability' && (
        <div className="card card-pad" style={{ maxWidth: 820 }}>
          <div className="label" style={{ marginBottom: 10 }}>Preferred learning format</div>
          <div className="seg">
            {Object.entries(FORMATS).map(([v, l]) => <button key={v} className={draft.format === v ? 'active' : ''} onClick={() => set('format', v)}>{l}</button>)}
          </div>
          <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>Days you're usually free</div>
          <div className="pill-select">
            {DAYS.map((d) => <button key={d} className={`pill-opt ${draft.availability.days.includes(d) ? 'active' : ''}`} onClick={() => set('availability', { ...draft.availability, days: toggle(draft.availability.days, d) })}>{d}</button>)}
          </div>
          <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Time of day</div>
          <div className="pill-select">
            {TIMES.map((t) => <button key={t} className={`pill-opt ${draft.availability.times.includes(t) ? 'active' : ''}`} onClick={() => set('availability', { ...draft.availability, times: toggle(draft.availability.times, t) })}>{t}</button>)}
          </div>
          <div className="small muted" style={{ marginTop: 18, padding: '12px 14px', background: 'var(--grad-soft)', borderRadius: 12 }}>
            Availability overlap counts towards your compatibility score — the more you share with someone, the higher you'll rank for each other.
          </div>
          <SaveBar dirty={dirty} onSave={save} onReset={() => setDraft(me)} />
        </div>
      )}

      {tab === 'connections' && (
        matches.length === 0 ? (
          <div className="card"><Empty icon={<Users size={28} />} title="No connections yet" text="Your mutual matches will appear here." action={<button className="btn btn-primary" onClick={() => navigate('/discover')}>Discover people</button>} /></div>
        ) : (
          <div className="grid grid-2">
            {matches.map((m) => {
              const mm = computeMatch(me, m.other)
              const done = sessions.filter((s) => s.matchId === m.id && s.status === 'completed').length
              return (
                <div key={m.id} className="card card-pad row" style={{ gap: 14 }}>
                  <Avatar user={m.other} size={56} />
                  <div className="grow">
                    <b>{m.other.name}</b>
                    <div className="tiny muted truncate">{m.other.headline}</div>
                    <div className="tiny subtle" style={{ marginTop: 2 }}>{done} session{done === 1 ? '' : 's'} completed · {mm.score}% match</div>
                  </div>
                  <button className="btn btn-soft btn-sm" onClick={() => navigate(`/messages/${m.id}`)}><MessageCircle size={15} /></button>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'progress' && (
        <div className="col" style={{ gap: 20 }}>
          <div className="grid grid-3">
            <div className="card stat"><div className="stat-icon" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}><BookOpen size={21} /></div><div><div className="stat-val">{hours(progress.learntMinutes)}h</div><div className="small muted">Learnt</div></div></div>
            <div className="card stat"><div className="stat-icon" style={{ background: 'var(--green-50)', color: 'var(--green)' }}><Award size={21} /></div><div><div className="stat-val">{hours(progress.taughtMinutes)}h</div><div className="small muted">Taught · {progress.taughtSessions} sessions</div></div></div>
            <div className="card stat"><div className="stat-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple)' }}><CalendarDays size={21} /></div><div><div className="stat-val">{sessions.filter((s) => s.status === 'confirmed').length}</div><div className="small muted">Upcoming sessions</div></div></div>
          </div>
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="card card-pad">
              <div className="card-title" style={{ marginBottom: 16 }}>Learning goals</div>
              <div className="col" style={{ gap: 18 }}>
                {progress.learnt.map((s) => {
                  const pct = Math.min(100, Math.round((s.minutes / s.goalMinutes) * 100))
                  return (
                    <div key={s.skill} className="row" style={{ gap: 14 }}>
                      <ScoreRing score={pct} size={52} stroke={5} />
                      <div className="grow">
                        <div className="row-between"><b>{s.skill}</b><span className="tiny muted">{s.level} → next level</span></div>
                        <div className="tiny muted" style={{ margin: '2px 0 8px' }}>{s.sessions} session{s.sessions === 1 ? '' : 's'} · {hours(s.minutes)}h of {s.goalMinutes / 60}h goal</div>
                        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
                      </div>
                    </div>
                  )
                })}
                {!progress.learnt.length && <span className="small subtle">Add skills you want to learn to track progress.</span>}
              </div>
            </div>
            <div className="card card-pad">
              <div className="card-title" style={{ marginBottom: 12 }}>Session history</div>
              {sessions.length === 0 ? (
                <Empty icon={<CalendarDays size={26} />} title="No sessions yet" text="Arrange a session from any chat to start tracking." />
              ) : (
                <div className="col" style={{ gap: 4 }}>
                  {[...sessions].reverse().map((s) => (
                    <a key={s.id} href={`#/messages/${s.matchId}`} className="list-item">
                      <Avatar user={s.other} size={38} />
                      <div className="grow">
                        <div className="small"><b>{s.skill}</b> <span className="muted">· {s.teacher === me.id ? 'taught' : 'with'} {firstName(s.other)}</span></div>
                        <div className="tiny subtle row" style={{ gap: 4 }}><Clock size={11} /> {new Date(`${s.date}T${s.time}`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {s.duration} min</div>
                      </div>
                      {s.status === 'completed' ? <CheckCircle2 size={18} color="var(--green)" /> : <span className={`badge ${s.status === 'confirmed' ? 'badge-green' : s.status === 'proposed' ? 'badge-amber' : 'badge-explore'}`}>{s.status}</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function SaveBar({ dirty, onSave, onReset }) {
  return (
    <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
      {dirty && <span className="tiny subtle grow">You have unsaved changes</span>}
      <button className="btn btn-ghost" onClick={onReset} disabled={!dirty}>Discard</button>
      <button className="btn btn-primary" onClick={onSave} disabled={!dirty}><Save size={16} /> Save changes</button>
    </div>
  )
}
