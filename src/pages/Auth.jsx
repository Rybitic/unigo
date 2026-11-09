import { useState } from 'react'
import { ArrowLeftRight, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Avatar, Logo, useToast } from '../components/ui'
import { getUser, logIn, logInDemo, signUp } from '../lib/db'
import { navigate } from '../lib/router'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/seed'

export function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isSignup && form.name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.')
    setBusy(true)
    try {
      if (isSignup) {
        await signUp(form)
        toast('Account created — let’s set up your profile')
        navigate('/onboarding')
      } else {
        const u = await logIn(form)
        toast(`Welcome back, ${u.name.split(' ')[0]}!`)
        navigate(u.onboarded ? '/home' : '/onboarding')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const demo = async () => {
    setError('')
    setBusy(true)
    try {
      await logInDemo()
      toast('Signed in as Priya — the demo account')
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const testimonial = getUser('u_maya')

  return (
    <div className="auth">
      <div className="auth-side">
        <div className="blob" style={{ width: 400, height: 400, background: '#22d3ee', bottom: -140, left: -100, opacity: 0.3 }} />
        <div className="blob" style={{ width: 360, height: 360, background: '#f0abfc', top: -120, right: -100, opacity: 0.3 }} />
        <div style={{ position: 'relative' }}>
          <div className="logo" style={{ color: 'white' }}>
            <span className="logo-mark" style={{ background: 'rgba(255,255,255,.18)', boxShadow: 'none' }}>
              <ArrowLeftRight size={18} strokeWidth={2.6} />
            </span>
            UniGO
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.04em', maxWidth: 440 }}>Your skills are someone else's next big opportunity.</h2>
          <p style={{ opacity: 0.85, marginTop: 14, fontSize: 17, maxWidth: 420 }}>Swap what you know for what you want to learn — with people who are just as curious as you.</p>
        </div>
        {testimonial && (
          <div style={{ position: 'relative', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: 20, maxWidth: 440 }}>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>“I learnt React from Hannah in exchange for Figma lessons. Honestly better than any bootcamp I looked at.”</p>
            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <Avatar user={testimonial} size={38} />
              <div>
                <div className="small" style={{ fontWeight: 700 }}>{testimonial.name}</div>
                <div className="tiny" style={{ opacity: 0.8 }}>{testimonial.headline}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit} noValidate>
          <div style={{ marginBottom: 8 }}>
            <Logo />
          </div>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800 }}>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
            <p className="muted" style={{ marginTop: 6 }}>{isSignup ? 'Start swapping skills in under two minutes.' : 'Log in to continue swapping skills.'}</p>
          </div>


          {error && <div className="form-error">{error}</div>}

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="name">Full name</label>
              <div className="input-icon">
                <User size={17} />
                <input id="name" className="input" placeholder="Jordan Lee" value={form.name} onChange={set('name')} autoComplete="name" />
              </div>
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <div className="input-icon">
              <Mail size={17} />
              <input id="email" type="email" className="input" placeholder="you@university.ac.uk" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <div className="input-icon" style={{ position: 'relative' }}>
              <Lock size={17} />
              <input id="password" type={show ? 'text' : 'password'} className="input" placeholder={isSignup ? 'At least 6 characters' : 'Your password'} value={form.password} onChange={set('password')} autoComplete={isSignup ? 'new-password' : 'current-password'} style={{ paddingRight: 44 }} />
              <button type="button" className="icon-btn" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 3, top: 3 }} aria-label="Toggle password visibility">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'} {!busy && <ArrowRight size={18} />}
          </button>

          <p className="small muted" style={{ textAlign: 'center' }}>
            {isSignup ? 'Already have an account? ' : 'New to UniGO? '}
            <a className="link" href={isSignup ? '#/login' : '#/signup'}>{isSignup ? 'Log in' : 'Create an account'}</a>
          </p>

          <div className="demo-box">
            <div className="row" style={{ gap: 6, fontWeight: 700, marginBottom: 4 }}>
              <Sparkles size={15} color="var(--purple)" /> Just exploring?
            </div>
            <div className="muted">
              Jump into a lived-in demo account (<code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code>).
            </div>
            <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} onClick={demo} disabled={busy}>
              Use demo account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
