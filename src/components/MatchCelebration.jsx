import { useEffect, useRef } from 'react'
import { ArrowLeftRight, MessageCircle } from 'lucide-react'
import { Avatar, SkillChip, firstName } from './ui'

function Confetti() {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      c.width = innerWidth * dpr
      c.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const colors = ['#a78bfa', '#60a5fa', '#f0abfc', '#ffffff', '#fde68a', '#5eead4']
    const parts = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.38,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 15 - 4,
      s: Math.random() * 7 + 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
      circle: Math.random() < 0.3,
    }))
    let raf
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of parts) {
        p.vy += 0.32
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        if (p.circle) {
          ctx.beginPath()
          ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2)
          ctx.fill()
        } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2)
        ctx.restore()
      }
      if (parts.some((p) => p.y < innerHeight + 20)) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('resize', resize)
    return () => (cancelAnimationFrame(raf), window.removeEventListener('resize', resize))
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
}

export function MatchCelebration({ me, other, match, onMessage, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div className="match-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Confetti />
      <div className="match-inner">
        <div className="tiny" style={{ letterSpacing: '.2em', fontWeight: 700, opacity: 0.8, marginBottom: 12 }}>MUTUAL MATCH</div>
        <div className="match-title">It's a Swap!</div>
        <p style={{ opacity: 0.85, marginTop: 12, fontSize: 16 }}>You and {firstName(other)} both want to learn from each other.</p>
        <div className="match-avatars">
          <div className="ma-left" style={{ position: 'absolute', left: 'calc(50% - 118px)' }}>
            <Avatar user={me} size={124} />
          </div>
          <div className="ma-right" style={{ position: 'absolute', left: 'calc(50% - 6px)' }}>
            <Avatar user={other} size={124} />
          </div>
          <div className="match-heart">
            <ArrowLeftRight size={22} strokeWidth={2.6} />
          </div>
        </div>
        {(match.theyTeachMe.length > 0 || match.iTeachThem.length > 0) && (
          <div className="swap-box">
            {match.theyTeachMe.length > 0 && (
              <div className="row wrap" style={{ gap: 8, fontSize: 14 }}>
                <span style={{ opacity: 0.8, minWidth: 110 }}>{firstName(other)} teaches you</span>
                {match.theyTeachMe.map((p) => <SkillChip key={p.skill} skill={p.skill} kind="teach" />)}
              </div>
            )}
            {match.iTeachThem.length > 0 && (
              <div className="row wrap" style={{ gap: 8, fontSize: 14 }}>
                <span style={{ opacity: 0.8, minWidth: 110 }}>You teach {firstName(other)}</span>
                {match.iTeachThem.map((p) => <SkillChip key={p.skill} skill={p.skill} kind="learn" />)}
              </div>
            )}
            <div className="tiny" style={{ opacity: 0.75 }}>{match.score}% compatibility · {match.tier.label}</div>
          </div>
        )}
        <div className="col" style={{ gap: 10, maxWidth: 340, margin: '0 auto', animation: 'pop .5s var(--ease) both 1s' }}>
          <button className="btn btn-lg" style={{ background: 'white', color: 'var(--purple-600)' }} onClick={onMessage}>
            <MessageCircle size={18} /> Send {firstName(other)} a message
          </button>
          <button className="btn btn-lg" style={{ color: 'white', background: 'rgba(255,255,255,.12)' }} onClick={onClose}>
            Keep discovering
          </button>
        </div>
      </div>
    </div>
  )
}
