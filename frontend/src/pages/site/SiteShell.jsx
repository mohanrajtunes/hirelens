import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap, motionOK, ScrollTrigger } from '../../lib/motion.js'

// Smooth scroll for the public page, driven by the same clock as the animations.
export default function SiteShell() {
  useEffect(() => {
    window.scrollTo(0, 0)
    if (!motionOK()) return
    const lenis = new Lenis({ lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
  return <Outlet />
}
