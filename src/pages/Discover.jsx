import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { X, Heart, RotateCcw, Info, MapPin, GraduationCap, Sparkles, SlidersHorizontal, Compass, ArrowLeftRight, Check, Wifi, Users } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Avatar, ScoreRing, SkillChip, TierBadge, Skeleton, Empty, useFakeLoading, useToast, firstName, Modal } from '../components/ui'
import { ProfileModal } from '../components/ProfileView'
import { MatchCelebration } from '../components/MatchCelebration'
import { currentUser, discoverQueue, swipe, undoSwipe, clearPasses, useDB, getSettings, updateSettings } from '../lib/db'
import { rankCandidates } from '../lib/matching'
import { CATEGORIES, categoryOf, FORMATS } from '../lib/skills'
import { navigate } from '../lib/router'

const REASON_ICON = { learn: '🎓', teach: '🤝', related: '🧭', level: '📈', interest: '💜', goal: '📚', location: '📍', format: '💻', warn: '⚠️' }

function SwipeCard({ item, me, isTop, depth, onDecision, onView, flyRef }) {
  const { user, match } = item
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const start = useRef(null)
  const wantSet = new Set(me.learn.map((s) => s.skill))
  const teachSet = new Set(me.teach.map((s) => s.skill))

  const fly = useCallback(
    (dir) => {
      if (leaving) return
      setLeaving(true)
      setPos((p) => ({ x: dir === 'like' ? 640 : -640, y: p.y + 60 }))
      setTimeout(() => onDecision(dir), 260)
    },
    [leaving, onDecision],
  )

  useEffect(() => {
    if (isTop) flyRef.current = fly
  }, [isTop, fly, flyRef])

  const onDown = (e) => {
    if (!isTop || leaving || e.target.closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }
  const onMove = (e) => {
    if (!dragging || !start.current) return
    setPos({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.4 })
  }
  const onUp = () => {
    if (!dragging) return
    setDragging(false)
    start.current = null
    if (pos.x > 110) fly('like')
    else if (pos.x < -110) fly('pass')
    else setPos({ x: 0, y: 0 })
  }

  const scale = 1 - depth * 0.045
  const offsetY = depth * 14
  const transform = isTop ? `translate(${pos.x}px, ${pos.y}px) rotate(${pos.x / 16}deg)` : `translateY(${offsetY}px) scale(${scale})`
  const likeO = Math.max(0, Math.min(1, pos.x / 100))
  const nopeO = Math.max(0, Math.min(1, -pos.x / 100))

  return (
    <div
      className={`swipe-card ${isTop ? 'top' : 'behind'}`}
      style={{ transform, transition: dragging ? 'none' : 'transform .38s var(--ease), opacity .3s', zIndex: 10 - depth, opacity: depth > 2 ? 0 : 1 }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="stamp like" style={{ opacity: likeO }}>SWAP</div>
      <div className="stamp nope" style={{ opacity: nopeO }}>PASS</div>

      <div className="sc-cover">
        <div className="sc-cover-bg" style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }} />
        <div className="sc-tier"><TierBadge tier={match.tier} /></div>
        <div className="sc-score">
          <ScoreRing score={match.score} size={50} stroke={5} />
          <div style={{ lineHeight: 1.2 }}>
            <div className="tiny subtle" style={{ fontWeight: 600 }}>Compatibility</div>
            <div className="small" style={{ fontWeight: 700 }}>{match.reciprocal ? 'Two-way swap' : 'One-way match'}</div>
          </div>
        </div>
        <div className="sc-photo"><Avatar user={user} size={100} /></div>
      </div>

      <div className="sc-body">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="sc-name truncate">{user.name}</div>
            <div className="row wrap small muted" style={{ gap: 12, marginTop: 2 }}>
              <span className="row" style={{ gap: 4 }}><MapPin size={14} /> {user.location.city}</span>
              {user.university && <span className="row truncate hide-mobile" style={{ gap: 4, maxWidth: 220 }}><GraduationCap size={14} /> <span className="truncate">{user.university}</span></span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onView} title="View full profile" style={{ background: 'var(--surface-2)' }}>
            <Info size={18} />
          </button>
        </div>
        <p className="sc-bio">{user.bio}</p>
        <div>
          <div className="sc-label">Can teach</div>
          <div className="sc-chips">{user.teach.map((s) => <SkillChip key={s.skill} {...s} kind="teach" highlight={wantSet.has(s.skill)} />)}</div>
        </div>
        <div>
          <div className="sc-label">Wants to learn</div>
          <div className="sc-chips">{user.learn.map((s) => <SkillChip key={s.skill} {...s} kind="learn" highlight={teachSet.has(s.skill)} />)}</div>
        </div>
        {match.reasons.length > 0 && (
          <div className="why">
            {match.reasons.slice(0, 3).map((r, i) => (
              <div key={i}><span>{REASON_ICON[r.type]}</span><span className="truncate">{r.text}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DeckSkeleton() {
  return (
    <div className="deck">
      <div className="swipe-card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <Skeleton h={210} r={0} />
        <div style={{ padding: '54px 24px 24px', display: 'grid', gap: 12 }}>
          <Skeleton w="55%" h={24} />
          <Skeleton w="40%" />
          <Skeleton h={54} />
          <Skeleton w="30%" h={10} />
          <div className="row"><Skeleton w={90} h={26} r={99} /><Skeleton w={110} h={26} r={99} /></div>
          <Skeleton w="30%" h={10} />
          <div className="row"><Skeleton w={100} h={26} r={99} /><Skeleton w={80} h={26} r={99} /></div>
        </div>
      </div>
    </div>
  )
}

export function Discover() {
  useDB()
  const me = currentUser()
  const toast = useToast()
  const loading = useFakeLoading(650)
  const settings = getSettings()
  const [filters, setFilters] = useState({ category: 'all', format: 'all', reciprocalOnly: false })
  const [refresh, setRefresh] = useState(0)
  const [deck, setDeck] = useState([])
  const [history, setHistory] = useState([])
  const [viewing, setViewing] = useState(null)
  const [celebrate, setCelebrate] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const flyRef = useRef(null)

  // Build the ranked deck. Re-ranked only when filters change, so the order
  // stays stable while swiping.
  useEffect(() => {
    let ranked = rankCandidates(me, discoverQueue())
    if (!settings.reciprocalFirst) ranked.sort((a, b) => b.match.score - a.match.score)
    ranked = ranked.filter(({ user, match }) => {
      if (filters.reciprocalOnly && !match.reciprocal) return false
      if (filters.category !== 'all' && !user.teach.some((s) => categoryOf(s.skill) === filters.category)) return false
      if (filters.format === 'online' && user.format === 'in-person') return false
      if (filters.format === 'in-person' && user.format === 'online') return false
      return true
    })
    setDeck(ranked)
  }, [filters, refresh])

  const top = deck[0]

  const decide = useCallback(
    (dir) => {
      const item = deck[0]
      if (!item) return
      const m = swipe(item.user.id, dir)
      setDeck((d) => d.slice(1))
      setHistory((h) => [...h, { item, dir, matched: !!m }])
      if (m) setCelebrate({ ...item, matchId: m.id })
      else if (dir === 'like') toast(`Liked ${firstName(item.user)} — you'll match if they like you back`, <Heart size={16} color="#f0abfc" fill="#f0abfc" />)
    },
    [deck, toast],
  )

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    if (last.matched) return toast("You've already matched — find them in My Matches")
    undoSwipe(last.item.user.id)
    setHistory((h) => h.slice(0, -1))
    setDeck((d) => [last.item, ...d])
  }

  useEffect(() => {
    const onKey = (e) => {
      if (viewing || celebrate || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return
      if (e.key === 'ArrowRight') flyRef.current?.('like')
      if (e.key === 'ArrowLeft') flyRef.current?.('pass')
      if (e.key === 'ArrowUp' && top) (e.preventDefault(), setViewing(top))
      if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const activeFilters = (filters.category !== 'all') + (filters.format !== 'all') + filters.reciprocalOnly
  const reciprocalLeft = deck.filter((d) => d.match.reciprocal).length

  const filterPanel = (
    <div className="col" style={{ gap: 18 }}>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>They can teach</div>
        <select className="select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="all">Any skill category</option>
          {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.label}</option>)}
        </select>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>Format</div>
        <div className="seg">
          {[['all', 'Any'], ['online', 'Online'], ['in-person', 'In person']].map(([v, l]) => (
            <button key={v} className={filters.format === v ? 'active' : ''} onClick={() => setFilters({ ...filters, format: v })}>{l}</button>
          ))}
        </div>
      </div>
      <label className="row-between" style={{ cursor: 'pointer' }}>
        <div>
          <div className="label">Two-way swaps only</div>
          <div className="hint">Both of you teach something the other wants</div>
        </div>
        <button className={`toggle ${filters.reciprocalOnly ? 'on' : ''}`} onClick={() => setFilters({ ...filters, reciprocalOnly: !filters.reciprocalOnly })} />
      </label>
      {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ category: 'all', format: 'all', reciprocalOnly: false })}>Clear filters</button>}
    </div>
  )

  return (
    <AppShell
      page="discover"
      title="Discover"
      actions={
        <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(true)} style={{ position: 'relative' }}>
          <SlidersHorizontal size={15} /> <span className="hide-mobile">Filters</span>
          {activeFilters > 0 && <span className="count" style={{ background: 'var(--purple)', position: 'absolute', top: -7, right: -7 }}>{activeFilters}</span>}
        </button>
      }
    >
      <div className="discover">
        <div className="deck-area">
          {loading ? (
            <DeckSkeleton />
          ) : deck.length === 0 ? (
            <div className="deck center">
              <div className="card" style={{ width: '100%' }}>
                <Empty
                  icon={<Compass size={28} />}
                  title={activeFilters ? 'No one matches these filters' : "You've seen everyone for now"}
                  text={activeFilters ? 'Try widening your filters to see more people.' : 'New people join every day. Meanwhile, check your matches or give passed profiles a second look.'}
                  action={
                    <div className="col" style={{ gap: 8 }}>
                      {activeFilters > 0 ? (
                        <button className="btn btn-primary" onClick={() => setFilters({ category: 'all', format: 'all', reciprocalOnly: false })}>Clear filters</button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => (clearPasses(), setHistory([]), setRefresh((r) => r + 1))}><RotateCcw size={16} /> Review passed profiles</button>
                      )}
                      <button className="btn btn-ghost" onClick={() => navigate('/matches')}>Go to My Matches</button>
                    </div>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="deck">
              {deck.slice(0, 3).map((item, i) => (
                <SwipeCard key={item.user.id} item={item} me={me} isTop={i === 0} depth={i} onDecision={decide} onView={() => setViewing(item)} flyRef={flyRef} />
              )).reverse()}
            </div>
          )}

          <div className="deck-actions">
            <button className="act act-sm" onClick={undo} disabled={!history.length} title="Undo (Z)" style={{ opacity: history.length ? 1 : 0.4 }}>
              <RotateCcw size={20} />
            </button>
            <button className="act act-lg act-pass" onClick={() => flyRef.current?.('pass')} disabled={!top} title="Pass (←)">
              <X size={30} strokeWidth={2.6} />
            </button>
            <button className="act act-lg act-like" onClick={() => flyRef.current?.('like')} disabled={!top} title="Like (→)">
              <Heart size={28} fill="white" />
            </button>
            <button className="act act-sm" onClick={() => top && setViewing(top)} disabled={!top} title="View profile (↑)" style={{ color: 'var(--blue)' }}>
              <Info size={21} />
            </button>
          </div>
          <div className="row small subtle hide-mobile" style={{ gap: 14, marginTop: 16 }}>
            <span className="row" style={{ gap: 5 }}><span className="kbd">←</span> Pass</span>
            <span className="row" style={{ gap: 5 }}><span className="kbd">→</span> Like</span>
            <span className="row" style={{ gap: 5 }}><span className="kbd">↑</span> Profile</span>
            <span className="row" style={{ gap: 5 }}><span className="kbd">Z</span> Undo</span>
          </div>
        </div>

        <aside className="discover-side col" style={{ gap: 16 }}>
          <div className="card card-pad">
            <div className="row" style={{ gap: 12 }}>
              <Avatar user={me} size={46} />
              <div className="grow">
                <div style={{ fontWeight: 700 }}>Your swap profile</div>
                <div className="tiny muted">What we match on</div>
              </div>
              <a href="#/profile" className="link">Edit</a>
            </div>
            <div className="sc-label" style={{ marginTop: 16 }}>You teach</div>
            <div className="sc-chips">{me.teach.map((s) => <SkillChip key={s.skill} {...s} kind="teach" />)}</div>
            <div className="sc-label" style={{ marginTop: 12 }}>You want to learn</div>
            <div className="sc-chips">{me.learn.map((s) => <SkillChip key={s.skill} {...s} kind="learn" />)}</div>
          </div>

          <div className="card card-pad">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <div className="card-title">Up next</div>
              <span className="badge badge-strong">{deck.length} left</span>
            </div>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <div className="stat-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple)', width: 38, height: 38 }}><ArrowLeftRight size={18} /></div>
              <div className="small"><b>{reciprocalLeft}</b> two-way swaps waiting</div>
            </div>
            <div className="col" style={{ gap: 4 }}>
              {deck.slice(1, 4).map(({ user, match }) => (
                <div key={user.id} className="row" style={{ gap: 10, padding: '6px 0' }}>
                  <Avatar user={user} size={34} />
                  <div className="grow small truncate" style={{ fontWeight: 600 }}>{user.name}</div>
                  <span className="tiny" style={{ fontWeight: 700, color: 'var(--purple)' }}>{match.score}%</span>
                </div>
              ))}
              {deck.length <= 1 && <div className="tiny subtle">That's everyone for now.</div>}
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 14 }}>Filters</div>
            {filterPanel}
          </div>
        </aside>
      </div>

      <Modal open={showFilters} onClose={() => setShowFilters(false)} title="Discovery filters" footer={<button className="btn btn-primary" onClick={() => setShowFilters(false)}>Show {deck.length} {deck.length === 1 ? 'person' : 'people'}</button>}>
        {filterPanel}
        <label className="row-between" style={{ marginTop: 18, cursor: 'pointer' }}>
          <div>
            <div className="label">Two-way swaps first</div>
            <div className="hint">Rank reciprocal matches above higher one-way scores</div>
          </div>
          <button className={`toggle ${settings.reciprocalFirst ? 'on' : ''}`} onClick={() => (updateSettings({ reciprocalFirst: !settings.reciprocalFirst }), setRefresh((r) => r + 1))} />
        </label>
      </Modal>

      <ProfileModal
        open={!!viewing}
        user={viewing?.user}
        match={viewing?.match}
        me={me}
        onClose={() => setViewing(null)}
        onPass={viewing && top && viewing.user.id === top.user.id ? () => (setViewing(null), setTimeout(() => flyRef.current?.('pass'), 120)) : undefined}
        onLike={viewing && top && viewing.user.id === top.user.id ? () => (setViewing(null), setTimeout(() => flyRef.current?.('like'), 120)) : undefined}
      />

      {celebrate && (
        <MatchCelebration
          me={me}
          other={celebrate.user}
          match={celebrate.match}
          onClose={() => setCelebrate(null)}
          onMessage={() => navigate(`/messages/${celebrate.matchId}`)}
        />
      )}
    </AppShell>
  )
}
