import { createContext, useCallback, useContext, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gsap, motionOK } from './motion.js'
import { scene } from './scene.js'
import { Logo } from '../components/bits.jsx'

const GoContext = createContext(() => {})

// Page changes go through a wipe: a circle of colour grows from the click,
// the route swaps underneath, then the colour lifts away.
export function TransitionProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const wipe = useRef(null)
  const busy = useRef(false)
  const here = useRef(location.pathname)
  here.current = location.pathname

  const go = useCallback(
    (to, event) => {
      if (busy.current) return
      if (to === here.current) {
        window.scrollTo({ top: 0, behavior: motionOK() ? 'smooth' : 'auto' })
        return
      }
      if (!motionOK()) {
        navigate(to)
        return
      }
      busy.current = true
      const el = wipe.current
      const x = event?.clientX || window.innerWidth / 2
      const y = event?.clientY || window.innerHeight / 2
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 20
      scene.kick = 1
      gsap
        .timeline({
          onComplete: () => {
            busy.current = false
          },
        })
        .set(el, { autoAlpha: 1, yPercent: 0, clipPath: `circle(0px at ${x}px ${y}px)` })
        .fromTo(el.firstChild, { scale: 0.4, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, 0.1)
        .to(el, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.5, ease: 'power3.in' }, 0)
        .add(() => navigate(to))
        .to(el, { yPercent: -100, duration: 0.6, ease: 'expo.inOut' }, '+=0.1')
        .set(el, { autoAlpha: 0 })
    },
    [navigate],
  )

  return (
    <GoContext.Provider value={go}>
      {children}
      <div className="wipe" ref={wipe} aria-hidden="true">
        <Logo size={72} />
      </div>
    </GoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGo = () => useContext(GoContext)

// A link that plays the wipe. Modifier clicks still open a new tab.
export function TLink({ to, onClick, children, ...rest }) {
  const go = useGo()
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
        e.preventDefault()
        onClick?.(e)
        go(to, e)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
