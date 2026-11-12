import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import { usePointerFun } from './lib/fun.js'
import { TransitionProvider } from './lib/nav.jsx'
import SiteShell from './pages/site/SiteShell.jsx'
import Home from './pages/site/Home.jsx'
import Auth from './pages/Auth.jsx'
import Sample from './pages/Sample.jsx'
import Built from './pages/Built.jsx'
import AppShell from './pages/app/AppShell.jsx'
import Overview from './pages/app/Overview.jsx'
import Match from './pages/app/Match.jsx'
import Tracker from './pages/app/Tracker.jsx'
import Gap from './pages/app/Gap.jsx'
import './styles/theme.css'

function Private({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <p className="boot">Opening HireLens</p>
  if (status === 'out') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  usePointerFun()
  return (
    <TransitionProvider>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="/sample" element={<Sample />} />
        <Route path="/built" element={<Built />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/app" element={<Private><AppShell /></Private>}>
          <Route index element={<Overview />} />
          <Route path="match" element={<Match />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="gap" element={<Gap />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransitionProvider>
  )
}
