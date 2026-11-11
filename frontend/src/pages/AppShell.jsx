import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { Logo } from '../components/bits.jsx'
import '../styles/app.css'

export default function AppShell() {
  const { user, logout } = useAuth()

  // The app is dark only. The flag lets the CSS switch the whole document.
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [])

  const name = user?.username || ''

  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="side__brand">
          <Logo size={26} />
          <span>HireLens</span>
        </Link>
        <nav className="side__nav" aria-label="App">
          <NavLink to="/app/match">Match</NavLink>
          <NavLink to="/app/tracker">Tracker</NavLink>
        </nav>
        <div className="side__foot">
          <div className="side__user">
            <span className="side__avatar" aria-hidden="true">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="side__name">{name}</span>
            <button type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="canvas">
        <Outlet />
      </main>
    </div>
  )
}
