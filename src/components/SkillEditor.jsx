import { useMemo, useRef, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { SKILL_NAMES, categoryMeta } from '../lib/skills'
import { LevelSelect } from './ui'

// Add/remove skills with an experience level each. Free-text skills allowed.
export function SkillEditor({ value, onChange, kind, exclude = [], levelHint }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hl, setHl] = useState(0)
  const inputRef = useRef()
  const taken = new Set([...value.map((v) => v.skill), ...exclude])

  const options = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = SKILL_NAMES.filter((s) => !taken.has(s) && s.toLowerCase().includes(term))
    if (term && !SKILL_NAMES.some((s) => s.toLowerCase() === term) && !taken.has(q.trim())) list.push(`__custom:${q.trim()}`)
    return list.slice(0, 8)
  }, [q, value, exclude])

  const add = (skill) => {
    if (skill.startsWith('__custom:')) skill = skill.slice(9).replace(/\b\w/g, (c) => c.toUpperCase())
    onChange([...value, { skill, level: kind === 'teach' ? 'Intermediate' : 'Beginner' }])
    setQ('')
    setHl(0)
    inputRef.current?.focus()
  }

  const popularOrder = kind === 'teach'
    ? ['Python', 'Excel', 'Graphic Design', 'Public Speaking', 'Video Editing', 'Finance', 'Web Development', 'Spanish', 'Photography', 'Copywriting']
    : ['Digital Marketing', 'UI/UX Design', 'Data Analytics', 'Python', 'Public Speaking', 'Investing', 'Video Editing', 'Web Development', 'Guitar', 'SQL']
  const quick = popularOrder.filter((s) => !taken.has(s)).slice(0, 8)

  return (
    <div className="col" style={{ gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <div className="input-icon">
          <Search size={17} />
          <input
            ref={inputRef}
            className="input"
            placeholder={kind === 'teach' ? 'Search skills you can teach…' : 'Search skills you want to learn…'}
            value={q}
            onChange={(e) => (setQ(e.target.value), setOpen(true), setHl(0))}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') (e.preventDefault(), setHl((h) => Math.min(h + 1, options.length - 1)))
              if (e.key === 'ArrowUp') (e.preventDefault(), setHl((h) => Math.max(h - 1, 0)))
              if (e.key === 'Enter' && options[hl]) (e.preventDefault(), add(options[hl]))
            }}
          />
        </div>
        {open && options.length > 0 && (
          <div className="suggest">
            {options.map((o, i) => {
              const custom = o.startsWith('__custom:')
              const name = custom ? o.slice(9) : o
              return (
                <button key={o} className={i === hl ? 'hl' : ''} onMouseDown={(e) => (e.preventDefault(), add(o))} onMouseEnter={() => setHl(i)}>
                  <span style={{ fontSize: 16 }}>{custom ? '✨' : categoryMeta(o).emoji}</span>
                  <span className="grow">{custom ? <>Add “{name}”</> : name}</span>
                  <span className="tiny subtle">{custom ? 'Custom' : categoryMeta(o).label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {quick.length > 0 && (
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tiny subtle" style={{ marginRight: 2 }}>Popular:</span>
          {quick.map((s) => (
            <button key={s} className="pill-opt" style={{ padding: '5px 11px', fontSize: 12.5 }} onClick={() => add(s)} type="button">
              <Plus size={12} style={{ verticalAlign: -2 }} /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="col" style={{ gap: 8 }}>
        {value.map((s, i) => (
          <div className="skill-row" key={s.skill}>
            <div className="name">
              <span>{categoryMeta(s.skill).emoji}</span>
              <span className="truncate">{s.skill}</span>
            </div>
            <LevelSelect value={s.level} onChange={(level) => onChange(value.map((v, j) => (j === i ? { ...v, level } : v)))} />
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${s.skill}`} type="button">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!value.length && <div className="hint" style={{ padding: '8px 2px' }}>No skills added yet — search above or tap a popular one.</div>}
        {value.length > 0 && levelHint && <div className="hint">{levelHint}</div>}
      </div>
    </div>
  )
}
