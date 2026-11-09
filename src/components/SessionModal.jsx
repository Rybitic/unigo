import { useMemo, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Modal, firstName } from './ui'
import { computeMatch } from '../lib/matching'

export function SessionModal({ open, onClose, me, other, onSubmit }) {
  const match = useMemo(() => computeMatch(me, other), [me, other])
  // Offer the skills actually being exchanged first, then everything else.
  const options = useMemo(() => {
    const opts = [
      ...match.theyTeachMe.map((p) => ({ skill: p.skill, teacher: other.id, learner: me.id })),
      ...match.iTeachThem.map((p) => ({ skill: p.skill, teacher: me.id, learner: other.id })),
    ]
    for (const s of other.teach) if (!opts.some((o) => o.skill === s.skill && o.teacher === other.id)) opts.push({ skill: s.skill, teacher: other.id, learner: me.id })
    for (const s of me.teach) if (!opts.some((o) => o.skill === s.skill && o.teacher === me.id)) opts.push({ skill: s.skill, teacher: me.id, learner: other.id })
    return opts
  }, [match, me, other])

  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const canMeet = me.format !== 'online' && other.format !== 'online'
  const [form, setForm] = useState({
    opt: 0,
    date: tomorrow,
    time: '18:00',
    duration: 60,
    format: canMeet && me.location?.city === other.location?.city ? 'in-person' : 'online',
    place: '',
    note: '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e })

  const submit = () => {
    const o = options[form.opt]
    onSubmit({
      skill: o.skill,
      teacher: o.teacher,
      learner: o.learner,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      format: form.format,
      place: form.place || (form.format === 'online' ? 'Google Meet (link to follow)' : 'To be agreed'),
      note: form.note,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Arrange a session with ${firstName(other)}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!options.length || !form.date || !form.time}>
            <CalendarPlus size={17} /> Send invite
          </button>
        </>
      }
    >
      <div className="col" style={{ gap: 16 }}>
        <div className="field">
          <label className="label">What will you cover?</label>
          <select className="select" value={form.opt} onChange={set('opt')}>
            {options.map((o, i) => (
              <option key={i} value={i}>
                {o.skill} — {o.teacher === me.id ? `you teach ${firstName(other)}` : `${firstName(other)} teaches you`}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-3" style={{ gap: 12 }}>
          <div className="field">
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={set('date')} />
          </div>
          <div className="field">
            <label className="label">Time</label>
            <input type="time" className="input" value={form.time} onChange={set('time')} />
          </div>
          <div className="field">
            <label className="label">Duration</label>
            <select className="select" value={form.duration} onChange={set('duration')}>
              {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Format</label>
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            {['online', 'in-person'].map((f) => (
              <button key={f} className={form.format === f ? 'active' : ''} onClick={() => setForm({ ...form, format: f })} type="button">
                {f === 'online' ? '💻 Online' : '☕ In person'}
              </button>
            ))}
          </div>
          {form.format === 'in-person' && !canMeet && <span className="hint">Heads up: {firstName(other)} prefers online sessions.</span>}
        </div>
        <div className="field">
          <label className="label">{form.format === 'online' ? 'Meeting link' : 'Where?'}</label>
          <input className="input" placeholder={form.format === 'online' ? 'e.g. meet.google.com/abc-defg-hij' : `e.g. Library café, ${me.location?.city || 'campus'}`} value={form.place} onChange={set('place')} />
        </div>
        <div className="field">
          <label className="label">Note <span className="subtle">(optional)</span></label>
          <textarea className="textarea" style={{ minHeight: 72 }} placeholder="What would you like to focus on?" value={form.note} onChange={set('note')} />
        </div>
      </div>
    </Modal>
  )
}
