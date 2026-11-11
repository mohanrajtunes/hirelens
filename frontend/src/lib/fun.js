import { useEffect } from 'react'
import { gsap, finePointer, motionOK } from './motion.js'

const COLORS = ['#ff4326', '#ff9a3d', '#f3f3f4', '#8f8f99', '#ffd9a8']

// A short burst of paper confetti from a point on screen. No sound, no library.
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 90) {
  if (!motionOK()) return
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.className = 'confetti'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const bits = Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4
    const speed = 7 + Math.random() * 13
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.5,
      c: COLORS[i % COLORS.length],
      round: i % 4 === 0,
    }
  })
  let frame = 0
  const tick = () => {
    frame += 1
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, frame - 70) / 50)
    for (const b of bits) {
      b.vy += 0.42
      b.vx *= 0.985
      b.x += b.vx
      b.y += b.vy
      b.r += b.vr
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.r)
      ctx.scale(1, Math.cos(frame * 0.2 + b.w))
      ctx.fillStyle = b.c
      if (b.round) {
        ctx.beginPath()
        ctx.arc(0, 0, b.h / 1.4, 0, Math.PI * 2)
        ctx.fill()
      } else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
      ctx.restore()
    }
    if (frame < 120) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}

// Buttons with .magnet lean toward the cursor, glass panels get a moving
// highlight, and a soft glow follows the pointer. One listener for the page.
export function usePointerFun() {
  useEffect(() => {
    if (!finePointer()) return
    const glow = document.createElement('div')
    glow.className = 'cursor-glow'
    glow.setAttribute('aria-hidden', 'true')
    document.body.appendChild(glow)
    const ok = motionOK()
    const gx = gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' })
    const gy = gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' })
    let pulled = null

    const move = (e) => {
      gx(e.clientX)
      gy(e.clientY)
      const glass = e.target.closest?.('.glass')
      if (glass) {
        const r = glass.getBoundingClientRect()
        glass.style.setProperty('--gx', `${e.clientX - r.left}px`)
        glass.style.setProperty('--gy', `${e.clientY - r.top}px`)
      }
      if (!ok) return
      const m = e.target.closest?.('.magnet')
      if (pulled && pulled !== m) {
        gsap.to(pulled, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
        pulled = null
      }
      if (m) {
        const r = m.getBoundingClientRect()
        gsap.to(m, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.4,
          duration: 0.35,
          ease: 'power3.out',
        })
        pulled = m
      }
    }
    const pop = (e) => {
      void e
    }
    window.addEventListener('click', pop)
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('click', pop)
      window.removeEventListener('pointermove', move)
      glow.remove()
    }
  }, [])
}
