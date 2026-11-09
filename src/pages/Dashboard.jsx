import { useMemo, useState } from 'react'
import { Compass, Heart, MessageCircle, CalendarDays, Clock, ArrowRight, Check, X, Sparkles, GraduationCap, BookOpen, Circle, CheckCircle2, Plus } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Avatar, ScoreRing, SkillChip, TierBadge, Skeleton, Empty, useFakeLoading, useToast, firstName, timeAgo } from '../components/ui'
import { ProfileModal } from '../components/ProfileView'
import { MatchCelebration } from '../components/MatchCelebration'
import { currentUser, discoverQueue, incomingLikes, myMatches, mySessions, profileCompletion, learningProgress, swipe, useDB, messagesFor, unreadCount } from '../lib/db'
import { computeMatch, rankCandidates } from '../lib/matching'
import { navigate } from '../lib/router'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function Dashboard() {
  useDB()
  const me = currentUser()
  const toast = useToast()
  const loading = useFakeLoading(500)
  const [viewing, setViewing] = useState(null)
  const [celebrate, setCelebrate] = useState(null)

  const completion = profileCompletion(me)
  const matches = myMatches()
  const likes = incomingLikes().map((u) => ({ user: u, match: computeMatch(me, u) })).sort((a, b) => b.match.score - a.match.score)
  const recommended = useMemo(() => rankCandidates(me, discoverQueue()).slice(0, 3), [me.id, matches.length, likes.length])
  const upcoming = mySessions().filter((s) => s.status === 'confirmed' || s.status === 'proposed').filter((s) => new Date(`${s.date}T${s.time}`) > Date.now() - 3600e3)
  const progress = learningProgress()
  const hours = (m) => Math.round((m / 60) * 10) / 10

  const respond = (item, action) => {
    const m = swipe(item.user.id, action)
    if (m) setCelebrate({ ...item, matchId: m.id })
    else toast(action === 'like' ? `Liked ${firstName(item.user)} — you'll match if they like you back` : `Passed on ${firstName(item.user)}`)
  }

  const stats = [
    { label: 'Matches', val: matches.length, icon: Heart, bg: 'var(--purple-50)', c: 'var(--purple)' },
    { label: 'Liked you', val: likes.length, icon: Sparkles, bg: '#fdf2f8', c: '#db2777' },
    { label: 'Hours learnt', val: hours(progress.learntMinutes), icon: BookOpen, bg: 'var(--blue-50)', c: 'var(--blue)' },
    { label: 'Hours taught', val: hours(progress.taughtMinutes), icon: GraduationCap, bg: 'var(--green-50)', c: 'var(--green)' },
  ]

  if (loading)
    return (
      <AppShell page="home" title="Home">
        <Skeleton h={130} r={20} />
        <div className="grid grid-4 stats" style={{ marginTop: 20 }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} h={82} r={20} />)}</div>
        <div className="dash-grid" style={{ marginTop: 20 }}>
          <Skeleton h={320} r={20} />
          <Skeleton h={320} r={20} />
        </div>
      </AppShell>
    )

  return (
    <AppShell page="home" title="Home">
      {/* Welcome */}
      <div className="card" style={{ background: 'var(--grad)', color: 'white', border: 0, padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div className="blob" style={{ width: 260, height: 260, background: '#22d3ee', right: -60, top: -120, opacity: 0.35 }} />
        <div className="blob" style={{ width: 200, height: 200, background: '#f0abfc', right: 200, bottom: -140, opacity: 0.3 }} />
        <div className="row-between wrap" style={{ position: 'relative', gap: 20 }}>
          <div>
            <div style={{ opacity: 0.85, fontWeight: 500 }}>{greeting()},</div>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>{firstName(me)} 👋</h2>
            <p style={{ opacity: 0.9, marginTop: 8, maxWidth: 480 }}>
              {likes.length > 0
                ? `${likes.length} ${likes.length === 1 ? 'person wants' : 'people want'} to swap skills with you. Don't keep them waiting!`
                : recommended.length
                  ? `We found ${recommended.length} new people who can teach you ${me.learn[0]?.skill || 'something new'}.`
                  : 'Your next skill swap is just a swipe away.'}
            </p>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-lg" style={{ background: 'white', color: 'var(--purple-600)' }} onClick={() => navigate('/discover')}>
              <Compass size={18} /> Discover matches
            </button>
            {upcoming[0] && (
              <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white' }} onClick={() => navigate(`/messages/${upcoming[0].matchId}`)}>
                <CalendarDays size={18} /> Next session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4 stats" style={{ marginTop: 20 }}>
        {stats.map((s) => (
          <div className="card stat" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.c }}><s.icon size={21} /></div>
            <div>
              <div className="stat-val">{s.val}</div>
              <div className="small muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid" style={{ marginTop: 20 }}>
        <div className="col" style={{ gap: 20, minWidth: 0 }}>
          {/* Recommended */}
          <div className="card card-pad">
            <div className="section-title">
              <h2>Recommended for you</h2>
              <a href="#/discover" className="link">Open Discover <ArrowRight size={14} /></a>
            </div>
            {recommended.length === 0 ? (
              <Empty icon={<Compass size={26} />} title="You're all caught up" text="You've seen everyone in the community. Check back soon — new members join daily." />
            ) : (
              <div className="grid grid-3" style={{ gap: 14 }}>
                {recommended.map(({ user, match }) => (
                  <div key={user.id} className="card card-hover" style={{ padding: 18, cursor: 'pointer', boxShadow: 'none' }} onClick={() => setViewing({ user, match })}>
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <Avatar user={user} size={52} />
                      <ScoreRing score={match.score} size={48} stroke={4} />
                    </div>
                    <div style={{ fontWeight: 700, marginTop: 12 }}>{user.name}</div>
                    <div className="tiny muted truncate">{user.headline}</div>
                    <div style={{ marginTop: 10 }}><TierBadge tier={match.tier} /></div>
                    <div className="tiny" style={{ marginTop: 10, color: 'var(--text-2)', minHeight: 36 }}>{match.reasons[0]?.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending requests */}
          <div className="card card-pad">
            <div className="section-title">
              <h2>Pending requests {likes.length > 0 && <span className="badge badge-strong" style={{ marginLeft: 6 }}>{likes.length}</span>}</h2>
              <a href="#/matches?tab=likes" className="link">See all <ArrowRight size={14} /></a>
            </div>
            {likes.length === 0 ? (
              <Empty icon={<Heart size={26} />} title="No pending requests" text="When someone likes your profile, they'll show up here so you can swap back." />
            ) : (
              <div className="col" style={{ gap: 4 }}>
                {likes.slice(0, 4).map((item) => (
                  <div className="list-item" key={item.user.id}>
                    <button onClick={() => setViewing(item)}><Avatar user={item.user} size={48} /></button>
                    <div className="grow" style={{ cursor: 'pointer' }} onClick={() => setViewing(item)}>
                      <div className="row" style={{ gap: 8 }}>
                        <b>{item.user.name}</b>
                        <span className="tiny" style={{ color: 'var(--purple)', fontWeight: 700 }}>{item.match.score}%</span>
                      </div>
                      <div className="tiny muted truncate">{item.match.reasons[0]?.text || item.user.headline}</div>
                    </div>
                    <button className="icon-btn" style={{ border: '1px solid var(--border)', color: 'var(--red)' }} onClick={() => respond(item, 'pass')} title="Decline"><X size={18} /></button>
                    <button className="btn btn-primary btn-sm" onClick={() => respond(item, 'like')}><Check size={16} /> Swap</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="grid grid-2">
            <div className="card card-pad">
              <div className="section-title"><h2>Skills you teach</h2><a href="#/profile?tab=skills" className="link"><Plus size={14} /> Add</a></div>
              <div className="col" style={{ gap: 8 }}>
                {me.teach.map((s) => (
                  <div key={s.skill} className="row-between">
                    <SkillChip skill={s.skill} kind="teach" />
                    <span className="tiny muted">{s.level}</span>
                  </div>
                ))}
                {!me.teach.length && <span className="small subtle">No skills yet.</span>}
              </div>
            </div>
            <div className="card card-pad">
              <div className="section-title"><h2>Skills you're learning</h2><a href="#/profile?tab=progress" className="link">Progress</a></div>
              <div className="col" style={{ gap: 12 }}>
                {progress.learnt.map((s) => (
                  <div key={s.skill}>
                    <div className="row-between" style={{ marginBottom: 6 }}>
                      <SkillChip skill={s.skill} kind="learn" />
                      <span className="tiny muted">{hours(s.minutes)}h / {s.goalMinutes / 60}h</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}><span style={{ width: `${Math.min(100, (s.minutes / s.goalMinutes) * 100)}%` }} /></div>
                  </div>
                ))}
                {!me.learn.length && <span className="small subtle">No learning goals yet.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 20, minWidth: 0 }}>
          {/* Profile completion */}
          <div className="card card-pad">
            <div className="row" style={{ gap: 16 }}>
              <ScoreRing score={completion.pct} size={68} stroke={6} />
              <div>
                <div className="card-title">Profile strength</div>
                <div className="small muted">{completion.pct === 100 ? 'Looking great — you’re fully discoverable.' : 'Complete profiles get more matches.'}</div>
              </div>
            </div>
            {completion.pct < 100 && (
              <div className="col" style={{ gap: 8, marginTop: 16 }}>
                {completion.checks.map(([label, done]) => (
                  <a key={label} href="#/profile" className="row small" style={{ gap: 8, color: done ? 'var(--text-3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
                    {done ? <CheckCircle2 size={16} color="var(--green)" /> : <Circle size={16} color="var(--border-strong)" />} {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming sessions */}
          <div className="card card-pad">
            <div className="section-title"><h2>Upcoming sessions</h2></div>
            {upcoming.length === 0 ? (
              <Empty icon={<CalendarDays size={26} />} title="No sessions booked" text="Match with someone and hit “Arrange session” in your chat." />
            ) : (
              <div className="col" style={{ gap: 10 }}>
                {upcoming.slice(0, 3).map((s) => {
                  const d = new Date(`${s.date}T${s.time}`)
                  return (
                    <a key={s.id} href={`#/messages/${s.matchId}`} className="list-item" style={{ border: '1px solid var(--border)' }}>
                      <div className="center" style={{ width: 50, height: 54, borderRadius: 12, background: 'var(--grad-soft)', flexShrink: 0, lineHeight: 1.1, textAlign: 'center' }}>
                        <div>
                          <div className="tiny" style={{ color: 'var(--purple)', fontWeight: 700 }}>{d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</div>
                          <div style={{ fontWeight: 800, fontSize: 20 }}>{d.getDate()}</div>
                        </div>
                      </div>
                      <div className="grow">
                        <div className="small" style={{ fontWeight: 700 }}>{s.skill}</div>
                        <div className="tiny muted">{s.teacher === me.id ? 'Teaching' : 'Learning with'} {firstName(s.other)}</div>
                        <div className="tiny subtle row" style={{ gap: 4 }}><Clock size={12} /> {s.time} · {s.duration} min · {s.format === 'online' ? 'Online' : 'In person'}</div>
                      </div>
                      {s.status === 'proposed' && <span className="badge badge-amber">Pending</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent connections */}
          <div className="card card-pad">
            <div className="section-title"><h2>Recent connections</h2><a href="#/matches" className="link">All</a></div>
            {matches.length === 0 ? (
              <Empty icon={<MessageCircle size={26} />} title="No matches yet" text="Like people in Discover — when they like you back, they appear here." action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/discover')}>Start discovering</button>} />
            ) : (
              <div className="col" style={{ gap: 2 }}>
                {matches.slice(0, 5).map((m) => {
                  const last = messagesFor(m.id).slice(-1)[0]
                  const unread = unreadCount(m.id)
                  return (
                    <a key={m.id} href={`#/messages/${m.id}`} className="list-item">
                      <Avatar user={m.other} size={42} online={m.other.isBot} />
                      <div className="grow">
                        <div className="row-between">
                          <b className="small">{m.other.name}</b>
                          <span className="tiny subtle">{timeAgo(last?.at || m.at)}</span>
                        </div>
                        <div className="tiny muted truncate" style={{ fontWeight: unread ? 700 : 400, color: unread ? 'var(--text)' : undefined }}>
                          {last ? (last.type === 'session' ? '📅 Session invite' : last.text) : 'New match — say hi 👋'}
                        </div>
                      </div>
                      {unread > 0 && <span className="count" style={{ background: 'var(--purple)' }}>{unread}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal
        open={!!viewing}
        user={viewing?.user}
        match={viewing?.match}
        me={me}
        onClose={() => setViewing(null)}
        onLike={viewing ? () => (respond(viewing, 'like'), setViewing(null)) : undefined}
        onPass={viewing && likes.some((l) => l.user.id === viewing.user.id) ? () => (respond(viewing, 'pass'), setViewing(null)) : undefined}
      />
      {celebrate && <MatchCelebration me={me} other={celebrate.user} match={celebrate.match} onClose={() => setCelebrate(null)} onMessage={() => navigate(`/messages/${celebrate.matchId}`)} />}
    </AppShell>
  )
}
