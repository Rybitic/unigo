import { useMemo, useRef, useState } from 'react'
import { Camera, ArrowLeft, ArrowRight, Check, Sparkles, MapPin, GraduationCap, Monitor, Users, Wifi } from 'lucide-react'
import { Avatar, Logo, ScoreRing, useToast } from '../components/ui'
import { SkillEditor } from '../components/SkillEditor'
import { currentUser, updateProfile, allUsers, logOut } from '../lib/db'
import { navigate } from '../lib/router'
import { DAYS, TIMES, INTERESTS } from '../lib/skills'
import { rankCandidates } from '../lib/matching'
import { fileToAvatar } from '../lib/image'

const STEPS = ['About you', 'Teach', 'Learn', 'Preferences', 'Ready']

export function Onboarding() {
  const me = currentUser()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [p, setP] = useState(() => ({
    name: me.name, avatar: me.avatar, headline: me.headline, university: me.university, bio: me.bio,
    location: { ...me.location }, teach: me.teach, learn: me.learn, interests: me.interests,
    format: me.format, availability: { ...me.availability },
  }))
  const fileRef = useRef()
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))

  const valid = [
    p.name.trim().length > 1 && p.location.city.trim() && p.bio.trim().length >= 10,
    p.teach.length > 0,
    p.learn.length > 0,
    p.availability.days.length > 0 && p.availability.times.length > 0,
    true,
  ][step]

  const hints = [
    'Add your name, city and a short bio (10+ characters) to continue.',
    'Add at least one skill you can teach.',
    'Add at least one skill you want to learn.',
    'Pick at least one day and one time of day.',
  ]

  const preview = useMemo(() => {
    if (step !== 4) return []
    return rankCandidates({ ...me, ...p }, allUsers().filter((u) => u.id !== me.id && u.onboarded))
  }, [step])
  const strong = preview.filter((r) => r.match.score >= 50)

  const upload = async (e) => {
    try {
      set('avatar', await fileToAvatar(e.target.files[0]))
    } catch (err) {
      toast(err.message)
    }
  }

  const finish = () => {
    updateProfile({ ...p, onboarded: true })
    toast('Profile complete — welcome to UniGO! 🎉')
    navigate('/discover')
  }

  const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  return (
    <div className="ob">
      <div className="ob-top">
        <Logo />
        <div className="ob-steps">
          {STEPS.map((s, i) => <span key={s} className={i <= step ? 'on' : ''} title={s} />)}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={async () => (await logOut(), navigate('/'))}>Exit</button>
      </div>

      <div className="card ob-card" key={step} style={{ animation: 'pageIn .4s var(--ease)' }}>
        <div className="tiny" style={{ color: 'var(--purple)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </div>

        {step === 0 && (
          <>
            <h2 style={{ marginTop: 8 }}>Let's get to know you</h2>
            <p className="muted" style={{ marginTop: 6 }}>This is what potential swap partners will see first.</p>
            <div className="row" style={{ gap: 20, marginTop: 26, alignItems: 'center' }}>
              <div className="photo-drop" onClick={() => fileRef.current.click()}>
                {p.avatar ? <img src={p.avatar} alt="" /> : <div className="col" style={{ alignItems: 'center', gap: 4 }}><Camera size={24} /><span className="tiny">Add photo</span></div>}
              </div>
              <input type="file" accept="image/*" hidden ref={fileRef} onChange={upload} />
              <div>
                <div style={{ fontWeight: 700 }}>Profile picture</div>
                <div className="small muted">Profiles with photos get 3× more matches.</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>{p.avatar ? 'Change' : 'Upload'}</button>
                  {p.avatar && <button className="btn btn-ghost btn-sm" onClick={() => set('avatar', '')}>Remove</button>}
                </div>
              </div>
            </div>
            <div className="grid grid-2" style={{ marginTop: 24, gap: 16 }}>
              <div className="field">
                <label className="label">Full name</label>
                <input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Headline</label>
                <input className="input" placeholder="e.g. Economics student · aspiring founder" value={p.headline} onChange={(e) => set('headline', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">University or workplace</label>
                <div className="input-icon"><GraduationCap size={17} /><input className="input" placeholder="University of Manchester" value={p.university} onChange={(e) => set('university', e.target.value)} /></div>
              </div>
              <div className="field">
                <label className="label">City</label>
                <div className="input-icon"><MapPin size={17} /><input className="input" placeholder="London" value={p.location.city} onChange={(e) => set('location', { ...p.location, city: e.target.value })} /></div>
              </div>
              <div className="field">
                <label className="label">Country</label>
                <input className="input" placeholder="United Kingdom" value={p.location.country} onChange={(e) => set('location', { ...p.location, country: e.target.value })} />
              </div>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="label">Short bio</label>
              <textarea className="textarea" maxLength={280} placeholder="What do you do, what are you working towards, and what makes you a good swap partner?" value={p.bio} onChange={(e) => set('bio', e.target.value)} />
              <span className="hint" style={{ textAlign: 'right' }}>{p.bio.length}/280</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ marginTop: 8 }}>What can you teach? 🎓</h2>
            <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>Everyone is good at something — coding, cooking spreadsheets, editing TikToks. Set your level honestly; it powers your matches.</p>
            <SkillEditor kind="teach" value={p.teach} onChange={(v) => set('teach', v)} levelHint="Your level = how well you could teach it." />
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginTop: 8 }}>What do you want to learn? 🚀</h2>
            <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>We'll prioritise people who can teach these — and who want to learn what you know.</p>
            <SkillEditor kind="learn" value={p.learn} onChange={(v) => set('learn', v)} exclude={p.teach.map((s) => s.skill)} levelHint="Level = where you are today. We'll match you with someone a step or two ahead." />
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginTop: 8 }}>How do you like to learn?</h2>
            <p className="muted" style={{ marginTop: 6 }}>We use this to find partners whose schedule and style fit yours.</p>
            <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>Preferred format</div>
            <div className="grid grid-3" style={{ gap: 12 }}>
              {[
                { v: 'online', icon: Wifi, t: 'Online', d: 'Video calls from anywhere' },
                { v: 'in-person', icon: Users, t: 'In person', d: 'Meet on campus or nearby' },
                { v: 'both', icon: Monitor, t: 'Either', d: 'Flexible — whatever works' },
              ].map((o) => (
                <button key={o.v} className="card" onClick={() => set('format', o.v)} style={{ padding: 16, textAlign: 'left', borderColor: p.format === o.v ? 'var(--purple)' : undefined, boxShadow: p.format === o.v ? '0 0 0 3px rgba(124,58,237,.15)' : undefined, transition: 'all .2s' }}>
                  <div className="row-between">
                    <o.icon size={20} color={p.format === o.v ? 'var(--purple)' : 'var(--text-3)'} />
                    {p.format === o.v && <Check size={18} color="var(--purple)" />}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 10 }}>{o.t}</div>
                  <div className="tiny muted">{o.d}</div>
                </button>
              ))}
            </div>
            <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>Days you're usually free</div>
            <div className="pill-select">
              {DAYS.map((d) => <button key={d} className={`pill-opt ${p.availability.days.includes(d) ? 'active' : ''}`} onClick={() => set('availability', { ...p.availability, days: toggle(p.availability.days, d) })}>{d}</button>)}
            </div>
            <div className="label" style={{ marginTop: 20, marginBottom: 10 }}>Time of day</div>
            <div className="pill-select">
              {TIMES.map((t) => <button key={t} className={`pill-opt ${p.availability.times.includes(t) ? 'active' : ''}`} onClick={() => set('availability', { ...p.availability, times: toggle(p.availability.times, t) })}>{t}</button>)}
            </div>
            <div className="label" style={{ marginTop: 24, marginBottom: 4 }}>Interests <span className="subtle" style={{ fontWeight: 500 }}>— helps find people you'll click with</span></div>
            <div className="pill-select" style={{ marginTop: 8 }}>
              {INTERESTS.map((t) => <button key={t} className={`pill-opt ${p.interests.includes(t) ? 'active' : ''}`} onClick={() => set('interests', toggle(p.interests, t))}>{t}</button>)}
            </div>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 12 }}>
              <Avatar user={{ ...me, ...p }} size={96} className="avatar-ring" />
              <span style={{ position: 'absolute', right: -4, bottom: -4, width: 34, height: 34, borderRadius: 99, background: 'var(--green)', color: 'white', display: 'grid', placeItems: 'center', border: '3px solid white' }}><Check size={18} /></span>
            </div>
            <h2 style={{ marginTop: 18 }}>You're all set, {p.name.split(' ')[0]}!</h2>
            <p className="muted" style={{ marginTop: 8, maxWidth: 440, marginInline: 'auto' }}>
              We analysed the community and found <b style={{ color: 'var(--purple)' }}>{strong.length} {strong.length === 1 ? 'person' : 'people'}</b> who are a strong fit for you
              {preview.filter((r) => r.match.reciprocal).length > 0 && <>, including <b>{preview.filter((r) => r.match.reciprocal).length} two-way swaps</b></>}.
            </p>
            <div className="col" style={{ gap: 10, maxWidth: 420, margin: '24px auto 0', textAlign: 'left' }}>
              {preview.slice(0, 3).map(({ user, match }) => (
                <div key={user.id} className="list-item" style={{ border: '1px solid var(--border)' }}>
                  <Avatar user={user} size={44} />
                  <div className="grow">
                    <div style={{ fontWeight: 700 }}>{user.name}</div>
                    <div className="tiny muted truncate">{match.reasons[0]?.text || user.headline}</div>
                  </div>
                  <ScoreRing score={match.score} size={46} stroke={4} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)} style={{ visibility: step ? 'visible' : 'hidden' }}>
            <ArrowLeft size={17} /> Back
          </button>
          <div className="row" style={{ gap: 12 }}>
            {!valid && <span className="tiny subtle hide-mobile">{hints[step]}</span>}
            {step < 4 ? (
              <button className="btn btn-primary" disabled={!valid} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={finish}>
                <Sparkles size={18} /> Start discovering
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
