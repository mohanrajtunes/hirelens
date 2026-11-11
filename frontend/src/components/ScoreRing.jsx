import { useRef } from 'react'
import { gsap, motionOK, useGSAP } from '../lib/motion.js'

const R = 52
const LEN = 2 * Math.PI * R

export const tone = (score) => (score == null ? 'none' : score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low')

// A ring that fills to the score while the number counts up.
export default function ScoreRing({ value, size = 168, caption, delay = 0 }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const arc = root.current.querySelector('.ring__arc')
      const num = root.current.querySelector('.ring__num')
      if (value == null) {
        gsap.set(arc, { strokeDashoffset: LEN })
        num.textContent = '?'
        return
      }
      const end = LEN * (1 - value / 100)
      if (!motionOK()) {
        gsap.set(arc, { strokeDashoffset: end })
        num.textContent = value
        return
      }
      const count = { v: 0 }
      gsap.fromTo(arc, { strokeDashoffset: LEN }, { strokeDashoffset: end, duration: 1.4, delay, ease: 'expo.out' })
      gsap.to(count, {
        v: value,
        duration: 1.2,
        delay,
        ease: 'power3.out',
        snap: { v: 1 },
        onUpdate: () => {
          num.textContent = count.v
        },
      })
      gsap.fromTo(root.current, { scale: 0.8 }, { scale: 1, duration: 0.9, delay, ease: 'elastic.out(1, 0.5)' })
    },
    { scope: root, dependencies: [value, delay], revertOnUpdate: true },
  )

  return (
    <figure className={`ring ring--${tone(value)}`} ref={root} style={{ '--size': `${size}px` }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring__track" cx="60" cy="60" r={R} />
        <circle className="ring__arc" cx="60" cy="60" r={R} strokeDasharray={LEN} strokeDashoffset={LEN} />
      </svg>
      <figcaption>
        <b className="ring__num">{value ?? '?'}</b>
        {caption && <span>{caption}</span>}
      </figcaption>
    </figure>
  )
}
