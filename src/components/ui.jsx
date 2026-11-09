import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { X, Check, Sparkles, ArrowLeftRight } from 'lucide-react'
import { categoryMeta, LEVELS } from '../lib/skills'

// ---------- Logo ----------
export function Logo({ size = 34, text = true }) {
  return (
    <a href="#/" className="logo">
      <span className="logo-mark" style={{ width: size, height: size }}>
        <ArrowLeftRight size={size * 0.52} strokeWidth={2.6} />
      </span>
      {text && (
        <span>
          Uni<b>GO</b>
        </span>
      )}
    </a>
  )
}

// ---------- Avatar ----------
const GRADS = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
]
export function Avatar({ user, size = 40, ring, online, className = '' }) {
  const [failed, setFailed] = useState(false)
  const name = user?.name || '?'
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const grad = GRADS[(name.charCodeAt(0) + name.length) % GRADS.length]
  return (
    <div className={`avatar ${ring ? 'avatar-ring' : ''} ${className}`} style={{ width: size, height: size, fontSize: size * 0.38, background: grad }}>
      {user?.avatar && !failed ? <img src={user.avatar} alt={name} onError={() => setFailed(true)} draggable={false} /> : initials}
      {online && <span className="online-dot" />}
    </div>
  )
}

// ---------- Skill chip ----------
export function SkillChip({ skill, level, kind = 'teach', highlight, onRemove }) {
  const cls = highlight ? 'chip chip-match' : kind === 'teach' ? 'chip chip-teach' : kind === 'learn' ? 'chip chip-learn' : 'chip'
  return (
    <span className={cls} title={highlight ? 'Matches your goals' : undefined}>
      {highlight ? <Sparkles size={12} /> : <span className="dot" style={{ background: categoryMeta(skill).color }} />}
      {skill}
      {level && <span className="chip-lvl">· {level}</span>}
      {onRemove && (
        <button className="chip-x" onClick={onRemove} aria-label={`Remove ${skill}`}>
          <X size={13} />
        </button>
      )}
    </span>
  )
}

// ---------- Score ring ----------
export function ScoreRing({ score, size = 56, stroke = 5, label = true, light }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(score))
    return () => cancelAnimationFrame(t)
  }, [score])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const id = useRef(`g${Math.random().toString(36).slice(2, 8)}`).current
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={light ? 'rgba(255,255,255,.25)' : '#eceaf6'} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} />
      </svg>
      {label && (
        <span className="val" style={{ fontSize: size * 0.28 }}>
          {score}
          <small style={{ fontSize: size * 0.16, fontWeight: 700, opacity: 0.6 }}>%</small>
        </span>
      )}
    </div>
  )
}

export function TierBadge({ tier }) {
  return (
    <span className={`badge badge-${tier.tone}`}>
      {tier.tone === 'perfect' && <Sparkles size={11} />}
      {tier.label}
    </span>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, footer, size }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} role="dialog" aria-modal="true">
        {title !== undefined && (
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Toasts ----------
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((text, icon) => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, icon }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.icon || <Check size={16} color="#34d399" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ---------- Misc ----------
export function Toggle({ on, onChange, label }) {
  return <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label} />
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function Skeleton({ w = '100%', h = 14, r, style }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

export function useFakeLoading(ms = 550) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

export function LevelSelect({ value, onChange }) {
  return (
    <div className="lvl-select">
      {LEVELS.map((l) => (
        <button key={l} className={value === l ? 'active' : ''} onClick={() => onChange(l)} type="button" title={l}>
          {l.slice(0, 3)}
          <span className="hide-mobile">{l.slice(3)}</span>
        </button>
      ))}
    </div>
  )
}

export function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// "5m ago", "3d ago", or "on Oct 24" for older timestamps.
export const ago = (ts) => {
  const t = timeAgo(ts)
  if (t === 'now') return 'just now'
  return Date.now() - ts < 604800e3 ? `${t} ago` : `on ${t}`
}

export const firstName = (u) => u?.name?.split(' ')[0] || ''
