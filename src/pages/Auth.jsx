import { useState } from 'react'
import { ArrowLeftRight, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, Info } from 'lucide-react'
import { Avatar, Logo, useToast } from '../components/ui'
import { getUser, logIn, logInDemo, signUp, savedAccounts } from '../lib/db'
import { navigate } from '../lib/router'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/seed'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

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
    await logInDemo()
    toast('Signed in as Priya — the demo account')
    navigate('/home')
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

          {!isSignup && savedAccounts().length > 0 && (
            <div className="col" style={{ gap: 6 }}>
              <div className="tiny subtle" style={{ fontWeight: 600 }}>Saved on this device</div>
              {savedAccounts().slice(0, 3).map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className="list-item"
                  style={{ border: `1px solid ${form.email === u.email ? 'var(--purple)' : 'var(--border)'}`, textAlign: 'left', width: '100%' }}
                  onClick={() => (setForm({ ...form, email: u.email }), setError(''), document.getElementById('password')?.focus())}
                >
                  <Avatar user={u} size={36} />
                  <div className="grow">
                    <div className="small" style={{ fontWeight: 600 }}>{u.name}</div>
                    <div className="tiny subtle truncate">{u.email}</div>
                  </div>
                  <ArrowRight size={16} color="var(--text-3)" />
                </button>
              ))}
            </div>
          )}

          <button type="button" className="google-btn" onClick={() => toast('Google sign-in activates once Supabase is connected — use email for now', <Info size={16} color="#93c5fd" />)}>
            <GoogleIcon /> Continue with Google
          </button>
          <div className="divider">or with email</div>

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
            <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} onClick={demo}>
              Use demo account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
