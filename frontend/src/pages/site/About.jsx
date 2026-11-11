import { useEffect, useRef } from 'react'
import { Draggable, gsap, SplitText } from '../../lib/motion.js'
import { useReveals } from '../../lib/reveal.js'
import { setScene } from '../../lib/scene.js'
import { TLink } from '../../lib/nav.jsx'
import { Em, Icon } from '../../components/bits.jsx'

const STICKERS = [
  ['Python', 'lime'], ['Django', 'cream'], ['DRF', 'violet'], ['PostgreSQL', 'coral'], ['JWT', 'cream'],
  ['React', 'violet'], ['GSAP', 'lime'], ['Three.js', 'magenta'], ['Git', 'coral'], ['REST', 'cream'],
]

const WORK = [
  {
    name: 'HireLens',
    kind: 'You are looking at it',
    text: 'AI job-match assistant. Django REST API with JWT, PDF parsing, an LLM read and rate limits. React, GSAP and Three.js in front.',
    href: 'https://github.com/mohanrajtunes/hirelens',
  },
  {
    name: 'PingBoard',
    kind: 'Live',
    text: 'Uptime monitor. Checks your sites every minute, opens an incident after two failed checks and emails you.',
    href: 'https://pingboard-frontend.vercel.app',
  },
  {
    name: 'ShopFlow',
    kind: 'Full stack',
    text: 'Multi-vendor store. JWT auth, transaction-safe stock and a storefront, deployed with PostgreSQL.',
    href: 'https://github.com/mohanrajtunes',
  },
]

export default function About() {
  const root = useRef(null)
  useEffect(() => setScene({ power: 0.9, shift: 6.2 }), [])

  useReveals(root, (ok) => {
    // The stickers can be thrown around the desk, with or without animation.
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
          <i /> About
        </p>
        <h1>
          Hi, I am <Em>Mohanraj.</Em>
        </h1>
        <p className="top__sub" data-rise>
          Backend developer from Puducherry, India. I build the API, the database behind it and the screen you click on.
          HireLens is the tool I wanted while applying for jobs.
        </p>
        <div className="hero__cta" data-rise>
          <a className="btn magnet" href="https://github.com/mohanrajtunes" target="_blank" rel="noreferrer">
            <Icon name="github" /> github.com/mohanrajtunes
          </a>
        </div>
      </section>

      <section className="sec">
        <div className="desk glass" data-rise>
          <p className="desk__hint">Drag these. Throw them. They are the tools I work with.</p>
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

      <section className="sec">
        <header className="sec__head">
          <h2 data-split>
            Things I have <Em>shipped.</Em>
          </h2>
        </header>
        <ul className="work">
          {WORK.map((w, i) => (
            <li key={w.name} data-rise>
              <a className="glass" href={w.href} target="_blank" rel="noreferrer">
                <b className="mono">0{i + 1}</b>
                <h3>{w.name}</h3>
                <span className="chip chip--hit">{w.kind}</span>
                <p>{w.text}</p>
                <Icon name="arrow" size={26} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="close">
        <h2 data-split>
          I am looking for <Em>a backend role.</Em>
        </h2>
        <p data-rise>B.Tech in Computer Science and Engineering. Python, Django and PostgreSQL are home.</p>
        <div className="hero__cta" data-rise>
          <a className="btn magnet" href="https://github.com/mohanrajtunes" target="_blank" rel="noreferrer">
            See my GitHub <Icon name="arrow" />
          </a>
          <TLink to="/play" className="btn btn--ghost magnet">
            Scan my resume
          </TLink>
        </div>
      </section>
    </div>
  )
}
