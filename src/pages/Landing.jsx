import { ArrowRight, ArrowLeftRight, X, Sparkles, UserPlus, Compass, MessagesSquare, Heart, Check, Wallet, Users, Brain, Clock, ShieldCheck, Globe, Instagram, Linkedin, Twitter, Youtube, Play, Star } from 'lucide-react'
import { Avatar, Logo, ScoreRing, SkillChip, useToast } from '../components/ui'
import { navigate } from '../lib/router'
import { allUsers, currentUser, logInDemo, useDB } from '../lib/db'
import { SEED_USERS } from '../lib/seed'
import { CATEGORIES, categoryOf } from '../lib/skills'
import { computeMatch } from '../lib/matching'

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const STORIES = [
  {
    user: 'u_alex', partner: 'u_noah',
    quote: 'I swapped SEO lessons for SQL. Six weeks later I built my own growth dashboard and got promoted to Head of Growth.',
    a: 'Digital Marketing', b: 'SQL', result: 'Promoted in 6 weeks',
  },
  {
    user: 'u_maya', partner: 'u_hannah',
    quote: "Hannah taught me React, I taught her Figma. We ended up co-founding a design-to-code tool. Best 'course' I never paid for.",
    a: 'UI/UX Design', b: 'Web Development', result: 'Co-founded a startup',
  },
  {
    user: 'u_sofia', partner: 'u_omar',
    quote: 'Omar was terrified of presenting. I needed Excel for my dissertation. We both nailed it — he presented at an all-hands last month.',
    a: 'Public Speaking', b: 'Excel', result: 'First-class dissertation',
  },
]

const BENEFITS = [
  { icon: Wallet, title: 'Learn for free', text: 'No tuition, no subscriptions. Your knowledge is the currency.' },
  { icon: Brain, title: 'Teach to master it', text: 'Explaining a skill is the fastest way to deepen it — the protégé effect, built in.' },
  { icon: Users, title: 'Build a real network', text: 'Every swap is a genuine connection with someone ambitious, not a faceless tutor.' },
  { icon: Clock, title: 'Learn on your schedule', text: 'Match on availability and format. Online, in person, mornings or late nights.' },
  { icon: ShieldCheck, title: 'Trusted community', text: 'University-verified profiles, mutual matching only, and ratings after every session.' },
  { icon: Globe, title: 'Practical, not theoretical', text: 'Learn from people who use the skill every day, on the problems you actually have.' },
]

export function Landing() {
  useDB()
  const toast = useToast()
  const users = allUsers().filter((u) => u.onboarded)
  const me = currentUser()
  const byId = Object.fromEntries(users.map((u) => [u.id, u]))
  const priya = SEED_USERS.find((u) => u.isDemo)
  const alex = byId.u_alex
  const sofia = byId.u_sofia
  const heroMatch = priya && alex ? computeMatch(priya, alex) : null

  const catCounts = Object.keys(CATEGORIES).map((k) => ({
    key: k,
    ...CATEGORIES[k],
    teachers: users.filter((u) => u.teach.some((s) => categoryOf(s.skill) === k)).length,
    skills: [...new Set(users.flatMap((u) => u.teach.map((s) => s.skill)).filter((s) => categoryOf(s) === k))].slice(0, 3),
  }))

  const start = () => navigate(me ? '/home' : '/signup')
  const demo = async () => {
    if (me) return navigate('/home')
    toast('Opening the demo account…')
    try {
      await logInDemo()
      toast('Signed in as Priya — the demo account')
      navigate('/home')
    } catch (err) {
      toast(err.message)
    }
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Logo />
          <div className="lp-links">
            <a onClick={() => scrollTo('how')} style={{ cursor: 'pointer' }}>How it works</a>
            <a onClick={() => scrollTo('skills')} style={{ cursor: 'pointer' }}>Skills</a>
            <a onClick={() => scrollTo('stories')} style={{ cursor: 'pointer' }}>Stories</a>
            <a onClick={() => scrollTo('why')} style={{ cursor: 'pointer' }}>Why UniGO</a>
          </div>
          <div className="row">
            {me ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/home')}>Open app <ArrowRight size={15} /></button>
            ) : (
              <>
                <a href="#/login" className="btn btn-ghost btn-sm hide-mobile">Log in</a>
                <a href="#/signup" className="btn btn-primary btn-sm">Get started</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="blob" style={{ width: 520, height: 520, background: '#c4b5fd', top: -160, right: -80 }} />
          <div className="blob" style={{ width: 420, height: 420, background: '#93c5fd', bottom: -120, right: 280 }} />
          <div className="blob" style={{ width: 300, height: 300, background: '#f5d0fe', top: 80, left: -120, opacity: 0.35 }} />
        </div>
        <div className="lp-container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">
                <span className="new">NEW</span> Your skills are someone else's next big opportunity
              </span>
              <h1>
                Learn Something New.
                <br />
                <span className="grad-text">Teach Something You Know.</span>
              </h1>
              <p className="lead">
                UniGO matches you with students and young professionals who can teach what you want to learn — and want to learn what you can teach. No fees. Just a fair swap of knowledge.
              </p>
              <div className="hero-ctas">
                <button className="btn btn-primary btn-lg" onClick={start}>
                  Get Started <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => scrollTo('skills')}>
                  Explore Skills
                </button>
              </div>
              <button className="link" style={{ marginTop: 18 }} onClick={demo}>
                <Play size={14} fill="currentColor" /> Try the live demo — no sign-up needed
              </button>
              <div className="trust">
                <div className="avatar-stack">
                  {users.slice(1, 6).map((u) => <Avatar key={u.id} user={u} size={34} />)}
                </div>
                <div>
                  <div className="row" style={{ gap: 2, color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <b style={{ color: 'var(--text)' }}>2,400+ swaps</b> across 40 universities
                </div>
              </div>
            </div>

            {/* Product visual built from live data */}
            <div className="hero-visual">
              {alex && heroMatch && (
                <div className="float-card float" style={{ width: 340, left: '50%', marginLeft: -170, top: 50, overflow: 'hidden' }}>
                  <div style={{ height: 110, background: 'var(--grad)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 14, right: 14, background: 'white', borderRadius: 14, padding: '6px 10px 6px 6px' }} className="row">
                      <ScoreRing score={heroMatch.score} size={40} stroke={4} />
                      <span className="tiny" style={{ fontWeight: 700 }}>{heroMatch.tier.label}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 20px 20px', marginTop: -36 }}>
                    <Avatar user={alex} size={76} className="avatar-ring" />
                    <h3 style={{ fontSize: 20, marginTop: 10 }}>{alex.name}</h3>
                    <div className="small muted">{alex.headline}</div>
                    <div className="sc-label" style={{ marginTop: 14 }}>Can teach</div>
                    <div className="sc-chips">{alex.teach.slice(0, 2).map((s) => <SkillChip key={s.skill} {...s} highlight={s.skill === 'Digital Marketing'} />)}</div>
                    <div className="sc-label" style={{ marginTop: 12 }}>Wants to learn</div>
                    <div className="sc-chips">{alex.learn.map((s) => <SkillChip key={s.skill} {...s} kind="learn" highlight />)}</div>
                    <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 18 }}>
                      <span className="act act-sm act-pass"><X size={22} /></span>
                      <span className="act act-lg act-like"><Heart size={26} fill="white" /></span>
                      <span className="act act-sm" style={{ color: 'var(--blue)' }}><Sparkles size={20} /></span>
                    </div>
                  </div>
                </div>
              )}
              {sofia && (
                <div className="float-card float d2" style={{ left: -30, top: -6, padding: 14, width: 230, zIndex: 2 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar user={sofia} size={38} online />
                    <div className="grow">
                      <div className="small" style={{ fontWeight: 700 }}>{sofia.name}</div>
                      <div className="tiny subtle">typing…</div>
                    </div>
                  </div>
                  <div className="bubble small" style={{ marginTop: 10, borderRadius: 14 }}>Same time Thursday? I'll bring the pitch deck 🎤</div>
                </div>
              )}
              <div className="float-card float d3" style={{ right: -10, bottom: 70, padding: '14px 16px', width: 240 }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="stat-icon" style={{ background: 'var(--grad)', color: 'white', width: 38, height: 38 }}><Heart size={18} fill="white" /></div>
                  <div>
                    <div className="small" style={{ fontWeight: 700 }}>It's a Swap! 🎉</div>
                    <div className="tiny subtle">Python ⇄ Digital Marketing</div>
                  </div>
                </div>
              </div>
              <div className="float-card float d2" style={{ left: -50, bottom: 10, padding: '12px 16px' }}>
                <div className="tiny subtle">This week</div>
                <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.03em' }}>+312 <span className="small" style={{ color: 'var(--green)' }}>sessions</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-container logos">
        <span className="small" style={{ fontWeight: 600 }}>Students from</span>
        {['UCL', 'Imperial', 'LSE', "King's", 'Manchester', 'Edinburgh', 'Warwick'].map((u) => <span key={u}>{u}</span>)}
      </div>

      {/* How it works */}
      <section id="how" className="lp-section alt">
        <div className="lp-container">
          <div className="lp-head">
            <div className="kicker">How it works</div>
            <h2>Three steps to your first swap</h2>
            <p>Our matching engine finds people whose skills complement yours — so both of you walk away smarter.</p>
          </div>
          <div className="grid grid-3">
            {[
              { icon: UserPlus, title: 'Share your skills', text: 'Tell us what you can teach, what you want to learn, and how good you are at each. Takes two minutes.' },
              { icon: Compass, title: 'Discover your matches', text: 'Swipe through people ranked by compatibility. Two-way swaps rise to the top. Like or pass — it’s that simple.' },
              { icon: MessagesSquare, title: 'Swap & grow', text: "When you both like each other, it's a match. Chat, book a session, and track your progress as you learn." },
            ].map((s, i) => (
              <div className="card card-hover step-card" key={s.title}>
                <div className="row-between">
                  <div className="step-num">{i + 1}</div>
                  <s.icon size={26} color="var(--purple)" style={{ opacity: 0.35 }} />
                </div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="skills" className="lp-section">
        <div className="lp-container">
          <div className="lp-head">
            <div className="kicker">Popular skills</div>
            <h2>What will you learn first?</h2>
            <p>From Python to public speaking — real skills taught by people who use them every day.</p>
          </div>
          <div className="grid grid-4">
            {catCounts.map((c) => (
              <div key={c.key} className="card card-hover cat-card" onClick={start}>
                <div className="cat-emoji" style={{ background: `${c.color}18` }}>{c.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.label}</div>
                <div className="small muted">{c.skills.join(' · ') || 'Coming soon'}</div>
                <div className="tiny" style={{ color: c.color, fontWeight: 700, marginTop: 'auto' }}>
                  {c.teachers} {c.teachers === 1 ? 'teacher' : 'teachers'} ready to swap →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="lp-section alt">
        <div className="lp-container">
          <div className="lp-head">
            <div className="kicker">Success stories</div>
            <h2>Swaps that changed careers</h2>
            <p>Real outcomes from people who traded what they know for what they needed.</p>
          </div>
          <div className="grid grid-3">
            {STORIES.map((s) => {
              const u = byId[s.user]
              const p = byId[s.partner]
              if (!u || !p) return null
              return (
                <div className="card card-hover story" key={s.user}>
                  <div className="row" style={{ gap: 2, color: '#f59e0b' }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={15} fill="currentColor" />)}</div>
                  <blockquote>“{s.quote}”</blockquote>
                  <div className="swap-line">
                    <SkillChip skill={s.a} /> <span className="subtle">⇄</span> <SkillChip skill={s.b} kind="learn" />
                  </div>
                  <div className="row-between" style={{ marginTop: 'auto' }}>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="avatar-stack">
                        <Avatar user={u} size={40} />
                        <Avatar user={p} size={40} />
                      </div>
                      <div>
                        <div className="small" style={{ fontWeight: 700 }}>{u.name.split(' ')[0]} & {p.name.split(' ')[0]}</div>
                        <div className="tiny subtle">{u.university?.replace('University of ', '')}</div>
                      </div>
                    </div>
                    <span className="badge badge-green"><Check size={11} /> {s.result}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="why" className="lp-section">
        <div className="lp-container">
          <div className="lp-head">
            <div className="kicker">Why skill exchange</div>
            <h2>The smartest way to learn is to teach</h2>
            <p>Courses are expensive and lonely. Swapping skills is free, social and sticks.</p>
          </div>
          <div className="grid grid-3">
            {BENEFITS.map((b) => (
              <div className="card benefit card-hover" key={b.title}>
                <div className="benefit-icon"><b.icon size={22} /></div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{b.title}</div>
                  <div className="small muted">{b.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cta-band" style={{ marginTop: 90 }}>
            <div className="blob" style={{ width: 300, height: 300, background: '#22d3ee', top: -100, left: -60, opacity: 0.35 }} />
            <div className="blob" style={{ width: 300, height: 300, background: '#f0abfc', bottom: -120, right: -40, opacity: 0.35 }} />
            <div style={{ position: 'relative' }}>
              <h2>Your skills are someone else's next big opportunity.</h2>
              <p style={{ opacity: 0.9, fontSize: 17, margin: '16px auto 30px', maxWidth: 520 }}>Join UniGO free and find your first swap in under five minutes.</p>
              <div className="row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-lg" style={{ background: 'white', color: 'var(--purple-600)' }} onClick={start}>Get Started — it's free <ArrowRight size={18} /></button>
                <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.14)', color: 'white' }} onClick={demo}>Try the demo</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" style={{ marginTop: 0 }}>
        <div className="lp-container">
          <div className="grid footer-grid">
            <div>
              <div className="logo" style={{ color: 'white' }}>
                <span className="logo-mark"><ArrowLeftRight size={18} strokeWidth={2.6} /></span> UniGO
              </div>
              <p className="small" style={{ marginTop: 14, maxWidth: 300 }}>The peer-to-peer skill exchange for students and young professionals. Learn something new. Teach something you know.</p>
              <div className="socials">
                {[Instagram, Linkedin, Twitter, Youtube].map((I, i) => (
                  <a key={i} href="#/" aria-label="Social link" onClick={(e) => e.preventDefault()}><I size={17} /></a>
                ))}
              </div>
            </div>
            <div>
              <h4>Product</h4>
              <a onClick={() => scrollTo('how')} style={{ cursor: 'pointer' }}>How it works</a>
              <a href="#/discover">Discover</a>
              <a href="#/matches">Matches</a>
              <a href="#/messages">Messages</a>
            </div>
            <div>
              <h4>Company</h4>
              <a onClick={() => scrollTo('stories')} style={{ cursor: 'pointer' }}>Stories</a>
              <a onClick={() => scrollTo('why')} style={{ cursor: 'pointer' }}>Why UniGO</a>
              <a href="#/signup">Join</a>
              <a href="#/login">Log in</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#/" onClick={(e) => e.preventDefault()}>Privacy</a>
              <a href="#/" onClick={(e) => e.preventDefault()}>Terms</a>
              <a href="#/" onClick={(e) => e.preventDefault()}>Community guidelines</a>
            </div>
          </div>
          <div className="row-between small" style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 48, paddingTop: 24, flexWrap: 'wrap' }}>
            <span>© {new Date().getFullYear()} UniGO. Made for learners, by learners.</span>
            <span>Your skills are someone else's next big opportunity.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
