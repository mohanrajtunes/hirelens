import { useEffect, useLayoutEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { finePointer, gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { setScene } from '../../lib/scene.js'
import { TLink } from '../../lib/nav.jsx'
import { Icon, Logo } from '../../components/bits.jsx'
import '../../styles/app.css'

const TABS = [
  ['/app', 'Dashboard', 'home'],
  ['/app/match', 'Match', 'lens'],
  ['/app/tracker', 'Tracker', 'board'],
  ['/app/gap', 'Skills gap', 'gap'],
]

// The dock: a pill of glass. At the top on a computer, at the bottom on a phone. Icons swell as the cursor nears
// them and a drop of light slides under the current page.
function Dock({ onLogout }) {
  const { pathname } = useLocation()
  const dock = useRef(null)
  const blob = useRef(null)

  useLayoutEffect(() => {
    const el = dock.current.querySelector('a[aria-current="page"]')
    if (!el) return
    gsap.to(blob.current, {
      x: el.offsetLeft,
      width: el.offsetWidth,
      autoAlpha: 1,
      duration: motionOK() ? 0.7 : 0,
      ease: 'elastic.out(1, 0.6)',
      overwrite: true,
    })
  }, [pathname])

  useEffect(() => {
    const again = () => {
      const el = dock.current?.querySelector('a[aria-current="page"]')
      if (el) gsap.set(blob.current, { x: el.offsetLeft, width: el.offsetWidth })
    }
    window.addEventListener('resize', again)
    document.fonts?.ready.then(again)
    return () => window.removeEventListener('resize', again)
  }, [])

  useGSAP(
    () => {
      const top = window.matchMedia('(min-width: 900px)').matches
      if (motionOK()) gsap.from(dock.current, { y: top ? -90 : 120, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.2 })
      if (top || !finePointer() || !motionOK()) return
      const items = gsap.utils.toArray('.dock__item')
      const swell = (e) => {
        items.forEach((item) => {
          const r = item.getBoundingClientRect()
          const d = Math.abs(e.clientX - (r.left + r.width / 2))
          const s = 1 + 0.38 * Math.max(0, 1 - d / 120)
          gsap.to(item.firstElementChild, { scale: s, y: -(s - 1) * 22, duration: 0.25, ease: 'power3.out', overwrite: true })
        })
      }
      const calm = () =>
        gsap.to('.dock__item > span', { scale: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)', overwrite: true })
      const el = dock.current
      el.addEventListener('pointermove', swell)
      el.addEventListener('pointerleave', calm)
      return () => {
        el.removeEventListener('pointermove', swell)
        el.removeEventListener('pointerleave', calm)
      }
    },
    { scope: dock },
  )

  return (
    <nav className="dock glass" ref={dock} aria-label="App">
      <span className="dock__blob" ref={blob} aria-hidden="true" />
      {TABS.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end={to === '/app'} className="dock__item">
          <span>
            <Icon name={icon} size={22} />
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
      <i className="dock__sep" aria-hidden="true" />
      <button type="button" className="dock__item" onClick={onLogout}>
        <span>
          <Icon name="out" size={22} />
        </span>
        <small>Sign out</small>
      </button>
    </nav>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const main = useRef(null)

  useEffect(() => setScene({ power: 0.5, shift: 20 + TABS.findIndex(([to]) => to === pathname) * 2 }), [pathname])

  // Each page lifts in, panel by panel.
  useGSAP(
    () => {
      window.scrollTo(0, 0)
      if (!motionOK()) return
      gsap.from('.title > *', { y: 40, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
    },
    { scope: main, dependencies: [pathname] },
  )

  const name = user?.username || ''

  return (
    <div className="app">
      <header className="app__top">
        <TLink to="/" className="app__brand">
          <Logo size={26} />
          <span>HireLens</span>
        </TLink>
        <p className="app__user">
          <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
          {name}
        </p>
      </header>
      <main className="app__main" ref={main} key={pathname}>
        <Outlet />
      </main>
      <Dock onLogout={logout} />
    </div>
  )
}
