import { useEffect, useRef } from 'react'
import { Draggable, gsap, SplitText } from '../../lib/motion.js'
import { useReveals } from '../../lib/reveal.js'
import { setScene } from '../../lib/scene.js'
import { TLink } from '../../lib/nav.jsx'
import { Em, Icon } from '../../components/bits.jsx'

const STICKERS = [
  ['Python', 'lime'], ['Docker', 'coral'], ['React', 'blue'], ['AWS', 'orange'], ['SQL', 'yellow'],
  ['LLM', 'violet'], ['Django', 'aqua'], ['Git', 'magenta'], ['RAG', 'lime'], ['JWT', 'yellow'],
]

const REASONS = [
  ['1', 'Applying blind wastes weeks', 'Most people send the same resume everywhere and never learn why nothing comes back. HireLens tells you before you send.'],
  ['2', 'Keyword tools are easy to fool', 'A plain keyword count misses meaning. HireLens adds an AI read of the whole post against your whole resume, and shows both numbers.'],
  ['3', 'Honest beats flattering', 'It names what you are missing and writes a note only from what is really on your resume. No made-up skills.'],
]

export default function Why() {
  const root = useRef(null)
  useEffect(() => setScene({ power: 0.9, shift: 8 }), [])

  useReveals(root, (ok) => {
    const desk = root.current.querySelector('.desk')
    Draggable.create('.sticker', {
      bounds: desk,
      inertia: ok,
      edgeResistance: 0.75,
      onPress() {
        gsap.to(this.target, { scale: 1.12, duration: 0.2 })
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
      },
    })
    if (!ok) return
    SplitText.create('.top h1', {
      type: 'chars',
      mask: 'chars',
      onSplit: (self) => gsap.from(self.chars, { yPercent: 120, rotation: 10, duration: 1, ease: 'expo.out', stagger: 0.03, delay: 0.2 }),
    })
    gsap.from('.why li', {
      rotationY: 70,
      autoAlpha: 0,
      transformOrigin: '0% 50%',
      duration: 1,
      ease: 'expo.out',
      stagger: 0.14,
      scrollTrigger: { trigger: '.why', start: 'top 80%', once: true },
    })
    gsap.from('.sticker', {
      y: -420,
      rotation: () => gsap.utils.random(-140, 140),
      autoAlpha: 0,
      duration: 1.3,
      ease: 'bounce.out',
      stagger: 0.07,
      scrollTrigger: { trigger: desk, start: 'top 80%', once: true },
    })
  })

  return (
    <div ref={root}>
      <section className="top">
        <p className="tag">
          <i /> Why HireLens
        </p>
        <h1>
          Stop applying <Em>blind.</Em>
        </h1>
        <p className="top__sub" data-rise>
          A job post is a list of asks. Your resume is a list of answers. HireLens puts them side by side, so you know
          where you stand before you hit send.
        </p>
      </section>

      <section className="sec">
        <ul className="why" style={{ perspective: '1400px' }}>
          {REASONS.map(([n, title, text]) => (
            <li className="glass" key={n}>
              <b>{n}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sec">
        <header className="sec__head">
          <h2 data-split>
            It knows <Em>48 skills.</Em>
          </h2>
        </header>
        <div className="desk glass" data-rise>
          <p className="desk__hint">Drag these. Throw them. These are some of the skills it looks for.</p>
          {STICKERS.map(([label, colour], i) => (
            <button
              type="button"
              className={`sticker sticker--${colour}`}
              key={label}
              style={{ left: `${6 + (i % 5) * 18}%`, top: `${i < 5 ? 26 : 58}%`, rotate: `${[-8, 5, -4, 9, -6, 7, -10, 4, -5, 8][i]}deg` }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="close">
        <h2 data-split>
          See it <Em>work.</Em>
        </h2>
        <div className="hero__cta" data-rise>
          <TLink to="/play" className="btn magnet">
            Open the playground <Icon name="arrow" />
          </TLink>
          <TLink to="/register" className="btn btn--ghost magnet">
            Create your account
          </TLink>
        </div>
      </section>
    </div>
  )
}
