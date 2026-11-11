import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, motionOK, useGSAP } from '../lib/motion.js'
import { TLink } from '../lib/nav.jsx'
import { useAuth } from '../lib/auth.jsx'
import { Icon, Logo } from './bits.jsx'

const LINKS = [
  ['/', 'Home'],
  ['/play', 'Demo'],
]

export default function Nav() {
  const { pathname } = useLocation()
  const { status } = useAuth()
  const [open, setOpen] = useState(false)
  const bar = useRef(null)
  const blob = useRef(null)

  // The lime drop sits under the current page and follows the cursor along the bar.
  const park = (el, quick) => {
    const drop = blob.current
    if (!drop) return
    if (!el) {
      gsap.to(drop, { autoAlpha: 0, scaleX: 0.4, duration: 0.3 })
      return
    }
    gsap.to(drop, {
      x: el.offsetLeft,
      width: el.offsetWidth,
      autoAlpha: 1,
      scaleX: 1,
      duration: quick || !motionOK() ? 0 : 0.65,
      ease: 'elastic.out(1, 0.62)',
      overwrite: true,
    })
  }
  const current = () => bar.current?.querySelector('.nav__links a[aria-current="page"]')

  useLayoutEffect(() => {
    park(current(), true)
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const again = () => park(current(), true)
    window.addEventListener('resize', again)
    document.fonts?.ready.then(again)
    return () => window.removeEventListener('resize', again)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('keydown', esc)
      document.documentElement.classList.remove('menu-open')
    }
  }, [open])

  useGSAP(
    () => {
      if (!motionOK()) return
      gsap.from(bar.current, { y: -90, autoAlpha: 0, duration: 1, ease: 'expo.out', delay: 0.15 })
    },
    { scope: bar },
  )

  useGSAP(
    () => {
      if (!open || !motionOK()) return
      gsap.from('.menu a', { yPercent: 120, rotation: 6, duration: 0.7, ease: 'expo.out', stagger: 0.06 })
    },
    { dependencies: [open] },
  )

  return (
    <>
      <header className="nav glass" ref={bar}>
        <TLink to="/" className="nav__brand" aria-label="HireLens home">
          <Logo size={26} />
          <span>HireLens</span>
        </TLink>
        <nav className="nav__links" aria-label="Site" onPointerLeave={() => park(current())}>
          <span className="nav__blob" ref={blob} aria-hidden="true" />
          {LINKS.map(([to, label]) => (
            <TLink
              key={to}
              to={to}
              aria-current={pathname === to ? 'page' : undefined}
              onPointerEnter={(e) => park(e.currentTarget)}
            >
              {label}
            </TLink>
          ))}
        </nav>
        <TLink to={status === 'in' ? '/app' : '/login'} className="btn btn--small nav__cta">
          {status === 'in' ? 'Open app' : 'Sign in'}
        </TLink>
        <button
          type="button"
          className="nav__burger"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <i />
          <i />
        </button>
      </header>

      {open && (
        <div className="menu" id="menu">
          <nav aria-label="Site, mobile">
            {LINKS.map(([to, label]) => (
              <div className="menu__row" key={to}>
                <TLink to={to} aria-current={pathname === to ? 'page' : undefined}>
                  {label}
                </TLink>
              </div>
            ))}
          </nav>
          <TLink to={status === 'in' ? '/app' : '/register'} className="btn">
            {status === 'in' ? 'Open app' : 'Get started'} <Icon name="arrow" />
          </TLink>
        </div>
      )}
    </>
  )
}
