import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarPlus, Send, Search, MessageCircle, MapPin, GraduationCap, CalendarDays, Clock, Video, Coffee, Check, X, CheckCircle2, Eye } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Avatar, ScoreRing, SkillChip, TierBadge, Empty, useToast, firstName, timeAgo, ago } from '../components/ui'
import { SessionModal } from '../components/SessionModal'
import { ProfileModal, MatchBreakdown } from '../components/ProfileView'
import { currentUser, myMatches, messagesFor, sendMessage, markRead, unreadCount, typing, getSession, proposeSession, setSessionStatus, useDB, sessionsFor } from '../lib/db'
import { computeMatch } from '../lib/matching'
import { navigate } from '../lib/router'

const fmtDay = (ts) => {
  const d = new Date(ts)
  const today = new Date()
  const y = new Date(Date.now() - 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}
const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

function SessionCard({ id, me }) {
  const toast = useToast()
  const s = getSession(id)
  if (!s) return null
  const iProposed = s.proposer === me.id
  const d = new Date(`${s.date}T${s.time}`)
  const STATUS = {
    proposed: <span className="badge badge-amber">Awaiting reply</span>,
    confirmed: <span className="badge badge-green"><Check size={11} /> Confirmed</span>,
    completed: <span className="badge badge-strong"><CheckCircle2 size={11} /> Completed</span>,
    declined: <span className="badge badge-explore">Declined</span>,
    cancelled: <span className="badge badge-explore">Cancelled</span>,
  }
  return (
    <div className="session-card">
      <div className="session-card-head">
        <CalendarDays size={18} color="var(--purple)" />
        <span className="grow">Learning session · {s.skill}</span>
        {STATUS[s.status]}
      </div>
      <div className="session-card-body">
        <div className="row"><CalendarDays size={15} /> {d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="row"><Clock size={15} /> {s.time} · {s.duration} minutes</div>
        <div className="row">{s.format === 'online' ? <Video size={15} /> : <Coffee size={15} />} {s.place}</div>
        <div className="row tiny">{s.teacher === me.id ? '🎓 You are teaching' : '📚 You are learning'}</div>
        {s.note && <div className="tiny" style={{ background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 10, color: 'var(--text-2)' }}>“{s.note}”</div>}
        {s.status === 'proposed' && !iProposed && (
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <button className="btn btn-secondary btn-sm grow" onClick={() => setSessionStatus(s.id, 'declined')}><X size={14} /> Decline</button>
            <button className="btn btn-primary btn-sm grow" onClick={() => (setSessionStatus(s.id, 'confirmed'), toast('Session confirmed'))}><Check size={14} /> Accept</button>
          </div>
        )}
        {s.status === 'proposed' && iProposed && <div className="tiny subtle">Waiting for confirmation…</div>}
        {s.status === 'confirmed' && (
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSessionStatus(s.id, 'cancelled')}>Cancel</button>
            <button className="btn btn-soft btn-sm grow" onClick={() => (setSessionStatus(s.id, 'completed'), toast(`+${s.duration} min added to your progress 🎉`))}><CheckCircle2 size={14} /> Mark as completed</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Messages({ route }) {
  useDB()
  const me = currentUser()
  const toast = useToast()
  const matches = myMatches()
  const activeId = route.params[0]
  const active = matches.find((m) => m.id === activeId)
  const [q, setQ] = useState('')
  const [text, setText] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [viewing, setViewing] = useState(false)
  const scrollRef = useRef()
  const inputRef = useRef()

  // On desktop, open the most recent conversation by default.
  useEffect(() => {
    if (!activeId && matches.length && window.innerWidth > 760) navigate(`/messages/${matches[0].id}`, { replace: true })
  }, [activeId, matches.length])

  const msgs = active ? messagesFor(active.id) : []
  const isTyping = active && typing[active.id]

  useEffect(() => {
    if (active) markRead(active.id)
  }, [active?.id, msgs.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, isTyping, active?.id])

  useEffect(() => {
    if (active && window.innerWidth > 760) inputRef.current?.focus()
  }, [active?.id])

  const match = useMemo(() => (active ? computeMatch(me, active.other) : null), [active?.id, me])

  const send = (t = text) => {
    const v = t.trim()
    if (!v || !active) return
    sendMessage(active.id, v)
    setText('')
  }

  const quick = active && match
    ? [
        match.iTeachThem[0] && `Happy to teach you ${match.iTeachThem[0].skill}! What's your current level?`,
        match.theyTeachMe[0] && `I'd love to learn ${match.theyTeachMe[0].skill} from you 🙌`,
        'When are you free this week?',
        'Online or in person?',
      ].filter(Boolean)
    : []

  const filtered = matches.filter((m) => m.other.name.toLowerCase().includes(q.toLowerCase()))

  if (!matches.length)
    return (
      <AppShell page="messages" title="Messages">
        <div className="card">
          <Empty icon={<MessageCircle size={28} />} title="No conversations yet" text="You can message people once you've matched. Head to Discover and start liking profiles!" action={<button className="btn btn-primary" onClick={() => navigate('/discover')}>Find your first match</button>} />
        </div>
      </AppShell>
    )

  let lastDay = null
  const upcoming = active ? sessionsFor(active.id).filter((s) => s.status === 'confirmed') : []

  return (
    <AppShell page="messages" title="Messages">
      <div className={`chat ${active ? 'has-active' : ''}`}>
        <div className="chat-list">
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <div className="input-icon">
              <Search size={16} />
              <input className="input" style={{ height: 40 }} placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="chat-list-items">
            {filtered.map((m) => {
              const last = messagesFor(m.id).slice(-1)[0]
              const unread = unreadCount(m.id)
              return (
                <button key={m.id} className={`convo ${m.id === activeId ? 'active' : ''}`} onClick={() => navigate(`/messages/${m.id}`)}>
                  <Avatar user={m.other} size={46} online={m.other.isBot} />
                  <div className="grow">
                    <div className="row-between">
                      <b className="small truncate">{m.other.name}</b>
                      <span className="tiny subtle">{timeAgo(last?.at || m.at)}</span>
                    </div>
                    <div className="row-between" style={{ gap: 6 }}>
                      <span className="tiny truncate" style={{ color: unread ? 'var(--text)' : 'var(--text-3)', fontWeight: unread ? 700 : 400 }}>
                        {typing[m.id] ? <i style={{ color: 'var(--purple)' }}>typing…</i> : last ? `${last.from === me.id ? 'You: ' : ''}${last.type === 'session' ? '📅 Session invite' : last.text}` : 'New match — say hi 👋'}
                      </span>
                      {unread > 0 && <span className="count" style={{ background: 'var(--purple)' }}>{unread}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
            {!filtered.length && <div className="tiny subtle" style={{ padding: 16, textAlign: 'center' }}>No conversations match “{q}”.</div>}
          </div>
        </div>

        {active ? (
          <div className="chat-main">
            <div className="chat-head">
              <button className="icon-btn mobile-only" onClick={() => navigate('/messages')} aria-label="Back"><ArrowLeft size={19} /></button>
              <button onClick={() => setViewing(true)}><Avatar user={active.other} size={42} online={active.other.isBot} /></button>
              <div className="grow" style={{ cursor: 'pointer' }} onClick={() => setViewing(true)}>
                <div style={{ fontWeight: 700 }}>{active.other.name}</div>
                <div className="tiny muted truncate">{isTyping ? <span style={{ color: 'var(--purple)' }}>typing…</span> : `${match.score}% match · ${active.other.headline}`}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setScheduling(true)}>
                <CalendarPlus size={16} /> <span className="hide-mobile">Arrange session</span>
              </button>
            </div>

            <div className="chat-scroll" ref={scrollRef}>
              <div className="col" style={{ alignItems: 'center', textAlign: 'center', padding: '10px 0 18px', gap: 8 }}>
                <Avatar user={active.other} size={72} />
                <div style={{ fontWeight: 700 }}>You matched with {firstName(active.other)} {ago(active.at)}</div>
                <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>
                  {match.theyTeachMe.map((p) => <SkillChip key={'a' + p.skill} skill={p.skill} kind="teach" />)}
                  {(match.theyTeachMe.length > 0 && match.iTeachThem.length > 0) && <span className="subtle">⇄</span>}
                  {match.iTeachThem.map((p) => <SkillChip key={'b' + p.skill} skill={p.skill} kind="learn" />)}
                </div>
              </div>
              {msgs.length === 0 && !isTyping && (
                <div className="tiny subtle" style={{ textAlign: 'center' }}>Break the ice — try one of the suggestions below.</div>
              )}
              {msgs.map((m, i) => {
                const day = fmtDay(m.at)
                const sep = day !== lastDay ? <div className="day-sep" key={'d' + m.id}>{day}</div> : null
                lastDay = day
                if (m.type === 'session') return [sep, <SessionCard key={m.id} id={m.sessionId} me={me} />]
                const mine = m.from === me.id
                const next = msgs[i + 1]
                const showAvatar = !mine && (!next || next.from !== m.from || next.type)
                return [
                  sep,
                  <div key={m.id} className={`bubble-row ${mine ? 'me' : ''}`}>
                    {!mine && <div style={{ width: 28 }}>{showAvatar && <Avatar user={active.other} size={28} />}</div>}
                    <div className="bubble">{m.text}</div>
                    <span className="msg-time">{fmtTime(m.at)}</span>
                  </div>,
                ]
              })}
              {isTyping && (
                <div className="bubble-row">
                  <Avatar user={active.other} size={28} />
                  <div className="bubble typing"><span /><span /><span /></div>
                </div>
              )}
            </div>

            {msgs.filter((m) => m.from === me.id).length < 2 && (
              <div className="quick-replies" style={{ paddingTop: 12 }}>
                {quick.map((qr) => <button key={qr} onClick={() => send(qr)}>{qr}</button>)}
              </div>
            )}
            <div className="composer">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={`Message ${firstName(active.other)}…`}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                    e.target.style.height = 'auto'
                  }
                }}
              />
              <button className="send-btn" onClick={() => send()} disabled={!text.trim()} aria-label="Send"><Send size={18} /></button>
            </div>
          </div>
        ) : (
          <div className="chat-main center">
            <Empty icon={<MessageCircle size={28} />} title="Select a conversation" text="Pick someone from the list to continue your swap." />
          </div>
        )}

        {active && (
          <aside className="chat-side">
            <div style={{ textAlign: 'center' }}>
              <Avatar user={active.other} size={88} className="avatar-ring" />
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>{active.other.name}</div>
              <div className="tiny muted">{active.other.headline}</div>
              <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}><TierBadge tier={match.tier} /></div>
            </div>
            <div className="col small muted" style={{ gap: 8, marginTop: 18 }}>
              <span className="row" style={{ gap: 8 }}><MapPin size={15} /> {active.other.location.city}</span>
              {active.other.university && <span className="row" style={{ gap: 8 }}><GraduationCap size={15} /> {active.other.university}</span>}
              <span className="row" style={{ gap: 8 }}><CalendarDays size={15} /> {active.other.availability.days.join(', ')} · {active.other.availability.times.join(', ')}</span>
            </div>
            <div className="sc-label" style={{ marginTop: 20 }}>Can teach</div>
            <div className="sc-chips">{active.other.teach.map((s) => <SkillChip key={s.skill} {...s} kind="teach" highlight={me.learn.some((l) => l.skill === s.skill)} />)}</div>
            <div className="sc-label" style={{ marginTop: 14 }}>Wants to learn</div>
            <div className="sc-chips">{active.other.learn.map((s) => <SkillChip key={s.skill} {...s} kind="learn" highlight={me.teach.some((l) => l.skill === s.skill)} />)}</div>

            {upcoming.length > 0 && (
              <>
                <div className="sc-label" style={{ marginTop: 20 }}>Upcoming</div>
                {upcoming.map((s) => (
                  <div key={s.id} className="small" style={{ padding: 10, borderRadius: 12, background: 'var(--grad-soft)', marginBottom: 6 }}>
                    <b>{s.skill}</b>
                    <div className="tiny muted">{new Date(`${s.date}T${s.time}`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {s.time}</div>
                  </div>
                ))}
              </>
            )}

            <div className="row" style={{ gap: 8, marginTop: 20 }}>
              <ScoreRing score={match.score} size={44} stroke={4} />
              <b className="small">Compatibility</b>
            </div>
            <div style={{ marginTop: 12 }}><MatchBreakdown match={match} /></div>
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 18 }} onClick={() => setViewing(true)}><Eye size={15} /> Full profile</button>
          </aside>
        )}
      </div>

      {active && scheduling && (
        <SessionModal
          open
          me={me}
          other={active.other}
          onClose={() => setScheduling(false)}
          onSubmit={(data) => {
            proposeSession(active.id, data)
            setScheduling(false)
            toast(`Session invite sent to ${firstName(active.other)}`)
          }}
        />
      )}
      <ProfileModal open={viewing && !!active} user={active?.other} match={match} me={me} onClose={() => setViewing(false)} />
    </AppShell>
  )
}
