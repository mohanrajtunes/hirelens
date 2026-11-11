import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorText } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { gsap, motionOK, useGSAP } from '../lib/motion.js'
import { setScene } from '../lib/scene.js'
import { TLink } from '../lib/nav.jsx'
import { Em, Logo } from '../components/bits.jsx'
import '../styles/app.css'

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  const { status, login, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: location.state?.username || '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const root = useRef(null)
  const next = location.state?.from || '/app'

  useEffect(() => setScene({ power: 0.9, shift: isLogin ? 10 : 12 }), [isLogin])

  useGSAP(
    () => {
      if (!motionOK()) return
      gsap.from('.auth__card', { y: 60, scale: 0.92, autoAlpha: 0, rotation: -3, duration: 1, ease: 'expo.out' })
      gsap.from('.auth__card > *', { y: 22, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: 0.2 })
      gsap.from('.auth__line', { x: -40, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.1 })
    },
    { scope: root, dependencies: [mode] },
  )

  if (status === 'in') return <Navigate to={next} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isLogin) await login(form.username.trim(), form.password)
      else await register({ ...form, username: form.username.trim() })
      navigate(next, { replace: true })
    } catch (err) {
      setError(
        isLogin && err.response?.status === 401
          ? 'That username and password do not match an account.'
          : err.response?.status === 429
            ? 'Too many tries. Wait a minute, then try again.'
            : errorText(err),
      )
      setBusy(false)
      if (motionOK()) gsap.fromTo('.auth__card', { x: -12 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)' })
    }
  }

  return (
    <div className="auth" ref={root}>
      <TLink to="/" className="auth__brand">
        <Logo />
        <span>HireLens</span>
      </TLink>

      <p className="auth__line">
        {isLogin ? (
          <>
            Welcome <Em>back.</Em>
          </>
        ) : (
          <>
            Create your <Em>account.</Em>
          </>
        )}
      </p>

      <form className="auth__card glass" onSubmit={submit}>
        <h1>{isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p className="quiet">{isLogin ? 'Sign in to check a job against your resume.' : 'It takes a minute. Your resume stays in your account.'}</p>

        <label className="field">
          <span>Username</span>
          <input value={form.username} onChange={set('username')} autoComplete="username" required autoFocus />
        </label>
        {!isLogin && (
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </label>
        )}
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 8}
            aria-describedby={isLogin ? undefined : 'pw-rule'}
            required
          />
          {!isLogin && <small id="pw-rule">At least 8 characters, not all numbers, not a common password.</small>}
        </label>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <button className="btn" disabled={busy}>
          {busy ? 'One moment' : isLogin ? 'Sign in' : 'Create account'}
        </button>
        <p className="auth__or">{isLogin ? 'New to HireLens?' : 'Already have an account?'}</p>
        <Link className="btn btn--ghost" to={isLogin ? '/register' : '/login'} state={location.state}>
          {isLogin ? 'Create an account' : 'Sign in instead'}
        </Link>
      </form>
    </div>
  )
}
