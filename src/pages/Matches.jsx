import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Send, Sparkles, X, Check, MoreHorizontal, UserMinus, Eye, Compass } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Avatar, ScoreRing, SkillChip, TierBadge, Empty, Skeleton, useFakeLoading, useToast, firstName, ago, Modal } from '../components/ui'
import { ProfileModal } from '../components/ProfileView'
import { MatchCelebration } from '../components/MatchCelebration'
import { currentUser, incomingLikes, myMatches, sentLikes, swipe, unmatch, useDB, undoSwipe } from '../lib/db'
import { computeMatch } from '../lib/matching'
import { navigate } from '../lib/router'

export function Matches({ route }) {
  useDB()
  const me = currentUser()
  const toast = useToast()
  const loading = useFakeLoading(450)
  const [tab, setTab] = useState(route.query.tab || 'matches')
  useEffect(() => {
    if (route.query.tab) setTab(route.query.tab)
  }, [route.query.tab])
  const [viewing, setViewing] = useState(null)
  const [celebrate, setCelebrate] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const matches = myMatches().map((m) => ({ ...m, match: computeMatch(me, m.other) }))
  const likes = incomingLikes().map((u) => ({ user: u, match: computeMatch(me, u) })).sort((a, b) => b.match.score - a.match.score)
  const sent = sentLikes().map((s) => ({ ...s, match: computeMatch(me, s.user) }))

  const respond = (item, action) => {
    const m = swipe(item.user.id, action)
    if (m) setCelebrate({ ...item, matchId: m.id })
    else toast(`Declined ${firstName(item.user)}`)
  }

  const tabs = [
    { k: 'matches', label: 'Matches', n: matches.length, icon: Heart },
    { k: 'likes', label: 'Liked you', n: likes.length, icon: Sparkles },
    { k: 'sent', label: 'Sent', n: sent.length, icon: Send },
  ]

  return (
    <AppShell page="matches" title="My Matches">
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.k} className={tab === t.k ? 'active' : ''} onClick={() => setTab(t.k)}>
            <t.icon size={16} /> {t.label}
            <span className="badge" style={{ background: tab === t.k ? 'var(--purple-50)' : 'var(--surface-2)', color: tab === t.k ? 'var(--purple-600)' : 'var(--text-2)' }}>{t.n}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-3">{[1, 2, 3].map((i) => <Skeleton key={i} h={260} r={20} />)}</div>
      ) : tab === 'matches' ? (
        matches.length === 0 ? (
          <div className="card"><Empty icon={<Heart size={28} />} title="No matches yet" text="When you and someone else both like each other, you'll see them here and can start chatting." action={<button className="btn btn-primary" onClick={() => navigate('/discover')}><Compass size={17} /> Discover people</button>} /></div>
        ) : (
          <div className="grid grid-3">
            {matches.map((m) => (
              <div key={m.id} className="card card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ height: 70, background: 'var(--grad)', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 12, top: 12 }}><TierBadge tier={m.match.tier} /></div>
                </div>
                <div style={{ padding: '0 20px 20px', marginTop: -34 }}>
                  <div className="row-between" style={{ alignItems: 'flex-end' }}>
                    <Avatar user={m.other} size={72} className="avatar-ring" />
                    <ScoreRing score={m.match.score} size={50} stroke={4} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17, marginTop: 10 }}>{m.other.name}</div>
                  <div className="tiny muted truncate">{m.other.headline}</div>
                  <div className="tiny subtle" style={{ marginTop: 2 }}>Matched {ago(m.at)}</div>
                  <div className="col" style={{ gap: 8, marginTop: 14, minHeight: 60 }}>
                    {m.match.theyTeachMe.length > 0 && (
                      <div className="row wrap" style={{ gap: 6 }}><span className="tiny subtle" style={{ width: 70 }}>Teaches you</span>{m.match.theyTeachMe.map((p) => <SkillChip key={p.skill} skill={p.skill} kind="teach" />)}</div>
                    )}
                    {m.match.iTeachThem.length > 0 && (
                      <div className="row wrap" style={{ gap: 6 }}><span className="tiny subtle" style={{ width: 70 }}>You teach</span>{m.match.iTeachThem.map((p) => <SkillChip key={p.skill} skill={p.skill} kind="learn" />)}</div>
                    )}
                    {!m.match.theyTeachMe.length && !m.match.iTeachThem.length && <span className="tiny muted">{m.match.reasons[0]?.text}</span>}
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 16 }}>
                    <button className="btn btn-primary btn-sm grow" onClick={() => navigate(`/messages/${m.id}`)}><MessageCircle size={15} /> Message</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setViewing({ user: m.other, match: m.match, matchId: m.id })}><Eye size={15} /></button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(m)} title="Unmatch"><UserMinus size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'likes' ? (
        likes.length === 0 ? (
          <div className="card"><Empty icon={<Sparkles size={28} />} title="No new likes" text="Complete your profile and add more skills to get noticed by more people." action={<a className="btn btn-secondary" href="#/profile">Improve profile</a>} /></div>
        ) : (
          <div className="grid grid-3">
            {likes.map((item) => (
              <div key={item.user.id} className="card card-hover card-pad" style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar user={item.user} size={88} className="avatar-ring" />
                  <span style={{ position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 99, background: 'var(--grad)', display: 'grid', placeItems: 'center', border: '3px solid white' }}><Heart size={14} fill="white" color="white" /></span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, marginTop: 12 }}>{item.user.name}</div>
                <div className="tiny muted">{item.user.headline}</div>
                <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 10 }}>
                  <TierBadge tier={item.match.tier} />
                  <span className="small" style={{ fontWeight: 800, color: 'var(--purple)' }}>{item.match.score}%</span>
                </div>
                <div className="tiny muted" style={{ marginTop: 10, minHeight: 34 }}>{item.match.reasons[0]?.text}</div>
                <div className="row" style={{ gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => respond(item, 'pass')}><X size={15} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setViewing(item)}><Eye size={15} /></button>
                  <button className="btn btn-primary btn-sm grow" onClick={() => respond(item, 'like')}><Check size={15} /> Swap back</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : sent.length === 0 ? (
        <div className="card"><Empty icon={<Send size={28} />} title="No pending likes" text="People you like who haven't liked you back yet will appear here." action={<button className="btn btn-primary" onClick={() => navigate('/discover')}>Go to Discover</button>} /></div>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          {sent.map((s) => (
            <div key={s.to} className="list-item">
              <Avatar user={s.user} size={48} />
              <div className="grow">
                <div className="row" style={{ gap: 8 }}><b>{s.user.name}</b><span className="tiny" style={{ color: 'var(--purple)', fontWeight: 700 }}>{s.match.score}%</span></div>
                <div className="tiny muted">Liked {ago(s.at)} · waiting for them to like you back</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewing({ user: s.user, match: s.match })}>View</button>
              <button className="btn btn-ghost btn-sm" onClick={() => (undoSwipe(s.to), toast(`Withdrew like for ${firstName(s.user)}`))}>Withdraw</button>
            </div>
          ))}
        </div>
      )}

      <ProfileModal
        open={!!viewing}
        user={viewing?.user}
        match={viewing?.match}
        me={me}
        onClose={() => setViewing(null)}
        onMessage={viewing?.matchId ? () => navigate(`/messages/${viewing.matchId}`) : undefined}
        onLike={viewing && tab === 'likes' ? () => (respond(viewing, 'like'), setViewing(null)) : undefined}
      />
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Unmatch ${firstName(confirm?.other)}?`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => (unmatch(confirm.id), toast(`Unmatched ${firstName(confirm.other)}`), setConfirm(null))}>Unmatch</button>
          </>
        }
      >
        <p className="muted">Your conversation and any planned sessions with {firstName(confirm?.other)} will be removed. This can't be undone.</p>
      </Modal>
      {celebrate && <MatchCelebration me={me} other={celebrate.user} match={celebrate.match} onClose={() => setCelebrate(null)} onMessage={() => navigate(`/messages/${celebrate.matchId}`)} />}
    </AppShell>
  )
}
