import { useEffect, useRef, useState } from 'react'
import { gsap, motionOK, ScrollTrigger, SplitText, useGSAP } from '../../lib/motion.js'
import { useAuth } from '../../lib/auth.jsx'
import { TLink } from '../../lib/nav.jsx'
import { Logo } from '../../components/bits.jsx'
import '../../styles/home.css'

// The example the cards show. Kind: h = on the resume, m = missing.
const POST = [
  ['We are hiring a Backend Developer to build '], ['REST API', 'h'], [' services in '], ['Python', 'h'], [' with '],
  ['Django', 'h'], [' and '], ['PostgreSQL', 'h'], ['. You will secure endpoints with '], ['JWT', 'h'], [', ship with '],
  ['Docker', 'm'], [' on '], ['AWS', 'm'], [', and keep queues healthy with '], ['Redis', 'm'], [' and '], ['Celery', 'm'],
  ['. Strong '], ['Git', 'h'], [' workflow expected.'],
]
const HAVE = POST.filter((p) => p[1] === 'h').map((p) => p[0])
const MISSING = POST.filter((p) => p[1] === 'm').map((p) => p[0])
const SCORE = 72
const LEN = 2 * Math.PI * 52

const NOTE =
  'I build Python and Django REST APIs secured with JWT and backed by PostgreSQL. I have not used Docker in production yet and am currently learning it.'.split(' ')
// The closing band shows the tracker: [column, [role, score, moves on scroll]].
const BOARD = [
  ['Saved', [['Backend Developer', 72, true], ['Full Stack Developer', 64]]],
  ['Applied', [['Python Developer', 81]]],
  ['Interview', [['API Developer', 77]]],
  ['Offer', []],
]
// The skills gap preview: [skill, how many of 5 saved jobs ask for it].
const GAP = [
  ['Docker', 4],
  ['AWS', 3],
  ['Redis', 2],
  ['Celery', 1],
]
const HOW = [
  ['Upload your resume', 'One PDF. It is read once and kept in your account.', 'M12 16V5m0 0-4 4m4-4 4 4M5 19h14'],
  ['Paste a job description', 'Copy the full post from any job site.', 'M8 5h8v3H8zM6 6.500H5v14h14v-14h-1M8.500 12.500h7m-7 4h5'],
  ['See where you stand', 'A score, the skills you are missing and a cover note. Save the job to your tracker.', 'M5 12.500l4.500 4.500L19 7.500'],
]
const BEATS = [
  ['Every requirement, checked.', 'HireLens reads the job description and checks each requirement against your resume.'],
  ['One clear score.', 'A single number out of 100, with the skills you already have and the ones you are missing.'],
  ['A cover note that is yours.', 'Written from your own resume. Nothing is added that you cannot back up.'],
]

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const Ring = ({ className = '', value }) => (
  <div className={`x-ring ${className}`}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="52" />
      <circle className="x-arc" cx="60" cy="60" r="52" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - value / 100)} />
    </svg>
    <b>{value}</b>
  </div>
)

const Marked = ({ parts }) =>
  parts.map(([text, kind], i) =>
    kind ? (
      <span className={`x-mk x-${kind}`} key={i}>
        {text}
      </span>
    ) : (
      <span key={i}>{text}</span>
    ),
  )

export default function Home() {
  const root = useRef(null)
  const { status } = useAuth()
  const start = status === 'in' ? '/app' : '/register'

  // Crossing the phone/computer width rebuilds the animation for the new layout.
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1000px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useGSAP(
    () => {
      const el = root.current
      const q = (s) => el.querySelector(s)
      const all = (s) => gsap.utils.toArray(el.querySelectorAll(s))
      const marks = all('.x-doc .x-mk')
      const chips = all('.x-res .x-chips span')
      const words = all('.x-note i')
      const res = q('.x-res')
      const pill = q('.x-pill')
      const setN = (list, n) => list.forEach((m, i) => m.classList.toggle('on', i < n))

      if (!motionOK()) {
        setN(marks, 99)
        setN(chips, 99)
        setN(words, 999)
        res.classList.add('on')
        pill.dataset.s = 'done'
        pill.textContent = 'Done'
        return
      }
      setN(marks, 0)
      setN(chips, 0)
      setN(words, 0)
      res.classList.remove('on')
      pill.dataset.s = 'ready'
      pill.textContent = 'Ready'
      const doc = q('.x-doc')
      const bar = q('.x-scan')
      const arc = q('.x-res .x-arc')
      const num = q('.x-res .x-ring b')
      gsap.set(arc, { strokeDashoffset: LEN })
      num.textContent = '0'

      // Where each skill sits in the job description, so the sweep lights it as it passes.
      let mids = []
      let docH = 0
      const measure = () => {
        docH = doc.offsetHeight
        mids = marks.map((m) => m.offsetTop + m.offsetHeight / 2)
      }
      measure()
      document.fonts?.ready.then(measure)
      ScrollTrigger.addEventListener('refresh', measure)

      // One timeline drives the whole screen: sweep, score, skills, cover note.
      // On a wide screen the scroll position scrubs it. On a phone it plays once.
      const s = { scan: 0, n: 0, chips: 0, words: 0 }
      const label = { ready: 'Ready', run: 'Checking', write: 'Writing', done: 'Done' }
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
      tl.to(
        s,
        {
          scan: 1,
          duration: 1.3,
          onUpdate: () => {
            const edge = s.scan * (docH + 90)
            gsap.set(bar, { y: edge - 90, autoAlpha: s.scan > 0 && s.scan < 1 ? 1 : 0 })
            marks.forEach((m, i) => m.classList.toggle('on', mids[i] < edge))
          },
        },
        0.6,
      )
        .to(arc, { strokeDashoffset: LEN * (1 - SCORE / 100), duration: 0.9, ease: 'power2.out' }, 2.2)
        .to(
          s,
          {
            n: SCORE,
            duration: 0.9,
            ease: 'power2.out',
            onUpdate: () => {
              num.textContent = Math.round(s.n)
              res.classList.toggle('on', s.n > 0.5)
            },
          },
          2.2,
        )
        .to(s, { chips: chips.length, duration: 0.8, onUpdate: () => setN(chips, Math.round(s.chips)) }, 2.5)
        .to(s, { words: words.length, duration: 1.1, onUpdate: () => setN(words, Math.round(s.words)) }, 3.6)
        .to({}, { duration: 0.5 })
      tl.eventCallback('onUpdate', () => {
        const t = tl.time()
        const st = t < 0.6 ? 'ready' : t < 3.6 ? 'run' : t < 4.65 ? 'write' : 'done'
        if (pill.dataset.s !== st) {
          pill.dataset.s = st
          pill.textContent = label[st]
        }
      })

      // Page load: nothing is ever hidden, so the page reads at once (and in previews
      // and screenshots). The pieces only settle into place.
      gsap.from('.x-nav', { y: -30, duration: 0.9, ease: 'expo.out' })
      gsap.from('.x-eyebrow, .x-hero h1, .x-sub, .x-hero .x-cta, .x-facts', { y: 28, duration: 1, ease: 'expo.out', stagger: 0.06 })
      gsap.from('.x-stage', { y: 70, scale: 0.96, duration: 1.3, ease: 'expo.out' })
      gsap.to('.x-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.2 } })

      let cleanTilt = () => {}
      if (wide) {
        el.classList.add('is-pin')
        const beats = all('.x-beat')
        gsap.set(beats, { autoAlpha: 0, y: 44 })
        gsap.set('.x-screen', { rotationY: -10, rotationX: 5 })
        gsap.to('.x-hint svg', { y: 5, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 })

        // the screen leans a little toward the cursor
        const ry = gsap.quickTo('.x-tilt', 'rotationY', { duration: 1.1, ease: 'power3' })
        const rx = gsap.quickTo('.x-tilt', 'rotationX', { duration: 1.1, ease: 'power3' })
        const tilt = (e) => {
          ry((e.clientX / window.innerWidth - 0.5) * 5)
          rx((0.5 - e.clientY / window.innerHeight) * 4)
        }
        window.addEventListener('pointermove', tilt, { passive: true })
        cleanTilt = () => window.removeEventListener('pointermove', tilt)

        // Scroll: the hero holds still. The screen stays where it is and runs the
        // check, while the text beside it changes to say what is happening.
        const inn = { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }
        const out = { autoAlpha: 0, y: -44, duration: 0.3, ease: 'power2.in' }
        tl.to('.x-copy', { ...out, duration: 0.35 }, 0)
          .to('.x-hint', { autoAlpha: 0, duration: 0.2, overwrite: true }, 0)
          .to('.x-hero', { backgroundColor: '#f6f4ee', duration: 0.6 }, 0.05)
          .to('.x-screen', { rotationY: 0, rotationX: 0, duration: 0.6, ease: 'power2.out' }, 0)
          .to(beats[0], inn, 0.3)
          .to(beats[0], out, 1.9)
          .to(beats[1], inn, 2.15)
          .to(beats[1], out, 3.3)
          .to(beats[2], inn, 3.55)
        ScrollTrigger.create({ trigger: '.x-hero', start: 'top top', end: '+=260%', pin: true, scrub: 0.6, anticipatePin: 1, animation: tl })
      } else {
        ScrollTrigger.create({ trigger: '.x-screen', start: 'top 60%', once: true, onEnter: () => tl.play() })
        gsap.from('.x-beat', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.x-beats', start: 'top 82%', once: true } })
      }

      all('.x-how h2, .x-dark h2, .x-gap h2, .x-end h2').forEach((h) =>
        SplitText.create(h, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 85%', once: true } }),
        }),
      )
      // The tracker in the closing band: cards drop in, then one moves from Saved to Applied.
      const endAt = { trigger: '.x-board', start: 'top 78%', once: true }
      gsap.from('.x-board', { y: 60, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: endAt })
      gsap.from('.x-card', { y: 18, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09, delay: 0.25, scrollTrigger: endAt })
      if (wide) {
        const cols = all('.x-cols > div')
        const card = q('.x-move')
        gsap
          .timeline({ scrollTrigger: endAt, delay: 1.3 })
          .to(card, { scale: 1.05, rotation: -2, boxShadow: '0 18px 30px -14px rgb(13 17 16 / 0.45)', duration: 0.25, ease: 'power2.out' })
          .to(card, { x: () => cols[1].offsetLeft - cols[0].offsetLeft, y: () => q('.x-cols > div:nth-child(2) .x-card').offsetHeight + 8, duration: 0.9, ease: 'power3.inOut' })
          .to(card, { scale: 1, rotation: 0, boxShadow: '0 0 0 0 rgb(13 17 16 / 0)', duration: 0.3, ease: 'power2.out' })
          .to(q('.x-cols > div:nth-child(1) .x-card:not(.x-move)'), { y: () => -(card.offsetHeight + 8), duration: 0.5, ease: 'power3.out' }, '-=0.6')
      }
      // How it works: the line draws across, then each step lands on it.
      const howAt = { trigger: '.x-how__list', start: 'top 80%', once: true }
      gsap.fromTo('.x-how__list', { '--draw': 0 }, { '--draw': 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: howAt })
      gsap.from('.x-how__list li', { y: 40, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.16, delay: 0.15, scrollTrigger: howAt })
      gsap.from('.x-how__icon', { scale: 0, rotation: -40, duration: 0.9, ease: 'back.out(2)', stagger: 0.16, delay: 0.3, scrollTrigger: howAt })
      gsap.from('.x-how__icon path', { drawSVG: 0, duration: 1, ease: 'power2.out', stagger: 0.16, delay: 0.55, scrollTrigger: howAt })
      const gapAt = { trigger: '.x-gapscreen', start: 'top 78%', once: true }
      gsap.from('.x-gapscreen', { y: 60, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: gapAt })
      gsap.from('.x-row', { x: -24, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1, delay: 0.2, scrollTrigger: gapAt })
      gsap.from('.x-track i', { scaleX: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, delay: 0.35, scrollTrigger: gapAt })
      gsap.from('.x-gap p:not(.x-lab), .x-gap .x-cta', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.x-gap', start: 'top 70%', once: true } })
      gsap.from('.x-end p', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.x-end', start: 'top 70%', once: true } })
      gsap.from('.x-dark p, .x-end .x-cta', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.x-dark', start: 'top 65%', once: true } })
      gsap.fromTo('.x-list li', { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: 'expo.inOut', stagger: 0.12, scrollTrigger: { trigger: '.x-list', start: 'top 78%', once: true } })
      gsap.from('.x-list li > *', { y: 26, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: '.x-list', start: 'top 78%', once: true } })

      return () => {
        ScrollTrigger.removeEventListener('refresh', measure)
        cleanTilt()
        el.classList.remove('is-pin')
      }
    },
    { scope: root, dependencies: [wide], revertOnUpdate: true },
  )

  return (
    <div className="x-root" ref={root}>
      <div className="x-progress" aria-hidden="true" />
      <header className="x-nav">
        <TLink to="/" className="x-brand">
          <Logo size={24} />
          HireLens
        </TLink>
        <div className="x-nav__r">
          <TLink to="/built" className="x-link x-link--wide">
            How it's built
          </TLink>
          <TLink to="/sample" className="x-link x-link--wide">
            Sample match
          </TLink>
          {status !== 'in' && (
            <TLink to="/login" className="x-link">
              Sign in
            </TLink>
          )}
          <TLink to={start} className="x-btn">
            {status === 'in' ? 'Dashboard' : 'Get started'}
          </TLink>
        </div>
      </header>

      <main>
        <section className="x-hero">
          <div className="x-hero__in x-wrap">
            <div className="x-left">
              <div className="x-copy">
                <p className="x-eyebrow">Resume and job matching</p>
                <h1>Know where you stand before you apply.</h1>
                <p className="x-sub">
                  HireLens compares your resume with a job description and shows your match score, the skills you are
                  missing, and a cover note written from your own experience.
                </p>
                <div className="x-cta">
                  <TLink to={start} className="x-btn x-btn--big magnet">
                    {status === 'in' ? 'Dashboard' : 'Get started, free'} <Arrow />
                  </TLink>
                  <TLink to="/sample" className="x-btn x-btn--big x-btn--line">
                    Try a sample match
                  </TLink>
                </div>
                <TLink to="/built" className="x-built">
                  See how the API works <Arrow />
                </TLink>
                <div className="x-facts">
                  <div>
                    <b>Clear score</b>One match score out of 100
                  </div>
                  <div>
                    <b>Private</b>Your resume stays in your account
                  </div>
                  <div>
                    <b>Fast</b>Results in seconds
                  </div>
                </div>
              </div>
              <div className="x-beats">
                {BEATS.map(([h, p], i) => (
                  <div className="x-beat" key={h}>
                    <span className="x-n x-mono">0{i + 1} / 03</span>
                    <h2>{h}</h2>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="x-stage" aria-label="Example of a match result">
              <div className="x-tilt">
                <div className="x-screen">
                  <div className="x-win">
                    <div className="x-bar">
                      <span>
                        <Logo size={18} />
                        Match
                      </span>
                      <span className="x-pill" data-s="ready">
                        Ready
                      </span>
                    </div>
                    <div className="x-body">
                      <div className="x-doc">
                        <p className="x-lab">Job description, example</p>
                        <h4>Backend Developer</h4>
                        <p>
                          <Marked parts={POST} />
                        </p>
                        <div className="x-scan" aria-hidden="true" />
                      </div>
                      <div className="x-res">
                        <p className="x-lab">Result</p>
                        <div className="x-score">
                          <Ring value={SCORE} />
                          <div className="x-verd">
                            <div>
                              <h5>No result yet</h5>
                              <p className="x-met">Waiting for the check</p>
                            </div>
                            <div>
                              <h5>Good match</h5>
                              <p className="x-met">
                                {HAVE.length} of {HAVE.length + MISSING.length} met
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="x-lab">On your resume</p>
                        <div className="x-chips">
                          {HAVE.map((s) => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>
                        <p className="x-lab">Missing</p>
                        <div className="x-chips x-chips--m">
                          {MISSING.map((s) => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="x-note">
                        <p className="x-lab">Cover note</p>
                        <p>
                          {NOTE.map((w, i) => (
                            <span key={i}>
                              <i>{w}</i>{' '}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="x-hint x-mono">
              Scroll to run the check
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </p>
          </div>
        </section>

        <section className="x-how">
          <div className="x-wrap">
            <p className="x-eyebrow">How it works</p>
            <h2>Three steps, about a minute.</h2>
            <ol className="x-how__list">
              {HOW.map(([t, d, icon], i) => (
                <li key={t}>
                  <span className="x-how__icon" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                  </span>
                  <span className="x-n x-mono">0{i + 1}</span>
                  <b>{t}</b>
                  <em>{d}</em>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="x-dark">
          <div className="x-wrap">
            <div>
              <h2>Everything you need before you apply.</h2>
              <p>One place to check a job, prepare your application and keep track of where each one stands.</p>
            </div>
            <ol className="x-list">
              <li>
                <span className="x-mono">01</span>
                <b>Match score</b>
                <em>A single score out of 100 for every job.</em>
              </li>
              <li>
                <span className="x-mono">02</span>
                <b>Missing skills</b>
                <em>The requirements your resume does not cover.</em>
              </li>
              <li>
                <span className="x-mono">03</span>
                <b>Cover note</b>
                <em>Written from your resume, in the tone you choose.</em>
              </li>
              <li>
                <span className="x-mono">04</span>
                <b>Application tracker</b>
                <em>Every application and its status on one board.</em>
              </li>
            </ol>
          </div>
        </section>

        <section className="x-gap">
          <div className="x-wrap">
            <div className="x-screen x-gapscreen" aria-label="Example of the skills gap page">
              <div className="x-win">
                <div className="x-bar">
                  <span>
                    <Logo size={18} />
                    Skills gap
                  </span>
                  <span className="x-pill">5 saved jobs</span>
                </div>
                <div className="x-bars">
                  <p className="x-lab">Asked for most, not on your resume</p>
                  {GAP.map(([skill, n]) => (
                    <div className="x-row" key={skill}>
                      <b>{skill}</b>
                      <span className="x-track">
                        <i style={{ '--w': n / 5 }} />
                      </span>
                      <em>{n} of 5 jobs</em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2>Know what to learn next.</h2>
              <p>HireLens adds up the skills your saved jobs ask for and ranks the ones your resume does not have yet.</p>
              <div className="x-cta">
                <TLink to="/sample" className="x-btn x-btn--big magnet">
                  Try a sample match <Arrow />
                </TLink>
              </div>
            </div>
          </div>
        </section>

        <section className="x-end">
          <div className="x-wrap">
            <div>
              <h2>Check your next application.</h2>
              <p>Save every job you check and move it along as things happen, from saved to offer.</p>
              <div className="x-cta">
                <TLink to={start} className="x-btn x-btn--big magnet">
                  {status === 'in' ? 'Dashboard' : 'Get started, free'} <Arrow />
                </TLink>
              </div>
            </div>
            <div className="x-screen x-board" aria-label="Example of the application tracker">
              <div className="x-win">
                <div className="x-bar">
                  <span>
                    <Logo size={18} />
                    Tracker
                  </span>
                  <span className="x-pill">4 applications</span>
                </div>
                <div className="x-cols">
                  {BOARD.map(([name, cards]) => (
                    <div key={name}>
                      <p className="x-lab">{name}</p>
                      {cards.map(([role, score, move]) => (
                        <div className={`x-card${move ? ' x-move' : ''}`} key={role}>
                          <b>{role}</b>
                          <span>{score}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="x-wrap x-foot">
        <span>© 2026 HireLens</span>
        <span>
          <TLink to="/built">How it is built</TLink>
          {'  ·  '}
          Built by{' '}
          <a href="https://github.com/mohanrajtunes" target="_blank" rel="noreferrer">
            Mohanraj S
          </a>
        </span>
      </footer>
    </div>
  )
}
