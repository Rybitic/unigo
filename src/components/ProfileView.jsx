import { MapPin, GraduationCap, Monitor, Calendar, Heart, X, MessageCircle, Sparkles, ArrowRight } from 'lucide-react'
import { Avatar, Modal, ScoreRing, SkillChip, TierBadge, firstName } from './ui'
import { BREAKDOWN_LABELS, WEIGHTS } from '../lib/matching'
import { FORMATS, DAYS } from '../lib/skills'

export function MatchBreakdown({ match }) {
  return (
    <div className="col" style={{ gap: 10 }}>
      {Object.entries(WEIGHTS).map(([k, max]) => (
        <div key={k}>
          <div className="row-between small" style={{ marginBottom: 5 }}>
            <span className="muted">{BREAKDOWN_LABELS[k]}</span>
            <b>
              {Math.round(match.breakdown[k])}
              <span className="subtle" style={{ fontWeight: 500 }}> / {max}</span>
            </b>
          </div>
          <div className="progress" style={{ height: 6 }}>
            <span style={{ width: `${(match.breakdown[k] / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileModal({ user, match, me, open, onClose, onLike, onPass, onMessage }) {
  if (!user) return null
  const wantSet = new Set(me.learn.map((s) => s.skill))
  const teachSet = new Set(me.teach.map((s) => s.skill))
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div style={{ margin: '-18px -24px 0', position: 'relative' }}>
        <div className="profile-cover" style={{ height: 130 }} />
        <button className="icon-btn" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.9)' }} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="row" style={{ marginTop: -48, alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <Avatar user={user} size={104} className="avatar-ring" />
        <div className="grow" style={{ paddingBottom: 4 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <h2 style={{ fontSize: 24 }}>{user.name}</h2>
            {match && <TierBadge tier={match.tier} />}
          </div>
          <div className="muted small">{user.headline}</div>
        </div>
        {match && <ScoreRing score={match.score} size={70} stroke={6} />}
      </div>

      <div className="row wrap small muted" style={{ gap: 16, marginTop: 16 }}>
        {user.location?.city && (
          <span className="row" style={{ gap: 5 }}>
            <MapPin size={15} /> {user.location.city}, {user.location.country}
          </span>
        )}
        {user.university && (
          <span className="row" style={{ gap: 5 }}>
            <GraduationCap size={15} /> {user.university}
          </span>
        )}
        <span className="row" style={{ gap: 5 }}>
          <Monitor size={15} /> {FORMATS[user.format]}
        </span>
      </div>

      <p style={{ marginTop: 16, lineHeight: 1.65 }}>{user.bio}</p>

      <div className="grid grid-2" style={{ marginTop: 22, gap: 16 }}>
        <div>
          <div className="sc-label">Can teach</div>
          <div className="sc-chips">
            {user.teach.map((s) => (
              <SkillChip key={s.skill} {...s} kind="teach" highlight={wantSet.has(s.skill)} />
            ))}
          </div>
        </div>
        <div>
          <div className="sc-label">Wants to learn</div>
          <div className="sc-chips">
            {user.learn.map((s) => (
              <SkillChip key={s.skill} {...s} kind="learn" highlight={teachSet.has(s.skill)} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="sc-label">Availability</div>
        <div className="row wrap" style={{ gap: 6 }}>
          {DAYS.map((d) => (
            <span key={d} className="chip" style={user.availability.days.includes(d) ? { background: 'var(--purple-50)', color: 'var(--purple-600)' } : { opacity: 0.45 }}>
              {d}
            </span>
          ))}
          <span className="chip">
            <Calendar size={12} /> {user.availability.times.join(', ') || 'Flexible'}
          </span>
        </div>
      </div>

      {user.interests?.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="sc-label">Interests</div>
          <div className="row wrap" style={{ gap: 6 }}>
            {user.interests.map((i) => (
              <span key={i} className="chip" style={match?.sharedInterests.includes(i) ? { background: 'var(--green-50)', color: '#047857' } : undefined}>
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {match && (
        <div className="card card-pad" style={{ marginTop: 24, background: 'var(--grad-soft)', border: '1px solid var(--purple-100)', boxShadow: 'none' }}>
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            <Sparkles size={17} color="var(--purple)" />
            <b>Why you match with {firstName(user)}</b>
          </div>
          {(match.theyTeachMe.length > 0 || match.iTeachThem.length > 0) && (
            <div className="col" style={{ gap: 8, marginBottom: 16 }}>
              {match.theyTeachMe.map((p) => (
                <div key={'a' + p.skill} className="swap-line" style={{ background: 'white' }}>
                  {firstName(user)} <ArrowRight size={14} /> you: <SkillChip skill={p.skill} kind="teach" />
                  <span className="subtle tiny">their {p.teacherLevel} · your {p.learnerLevel}</span>
                </div>
              ))}
              {match.iTeachThem.map((p) => (
                <div key={'b' + p.skill} className="swap-line" style={{ background: 'white' }}>
                  You <ArrowRight size={14} /> {firstName(user)}: <SkillChip skill={p.skill} kind="learn" />
                  <span className="subtle tiny">your {p.teacherLevel} · their {p.learnerLevel}</span>
                </div>
              ))}
            </div>
          )}
          <MatchBreakdown match={match} />
        </div>
      )}

      {(onLike || onPass || onMessage) && (
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          {onPass && (
            <button className="btn btn-secondary" onClick={onPass}>
              <X size={17} /> Pass
            </button>
          )}
          {onLike && (
            <button className="btn btn-primary" onClick={onLike}>
              <Heart size={17} /> Like {firstName(user)}
            </button>
          )}
          {onMessage && (
            <button className="btn btn-primary" onClick={onMessage}>
              <MessageCircle size={17} /> Message
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
