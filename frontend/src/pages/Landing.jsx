import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import { MOTION_OK, gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/motion.js'
import Backdrop from '../components/Backdrop.jsx'
import ResumeScene from '../components/ResumeScene.jsx'
import { useAuth } from '../lib/auth.jsx'
import { Logo, Marked, Mk } from '../components/bits.jsx'
import { SAMPLE_RESUME, compare } from '../lib/skills.js'
import '../styles/landing.css'

const EXAMPLES = [
  ['Backend role', 'Django, PostgreSQL, Docker, AWS'],
  ['Full stack role', 'React, TypeScript, Node.js, MongoDB'],
  ['Python role', 'Python, REST API, JWT, Redis, Celery'],
]

const POST =
  'We need a Python Django developer with REST API, PostgreSQL, Docker and AWS experience. Knowledge of Redis and Celery is a plus.'
const POST_HITS = ['python', 'django', 'rest api', 'postgresql']
const POST_MISSES = ['docker', 'aws', 'redis', 'celery']

const STEPS = [
  {
    id: 'score',
    title: 'A score you can check',
    body: 'Forty percent is a keyword match against the post. Sixty percent is an AI read of your whole resume. You see both numbers, not only the total.',
  },
  {
    id: 'note',
    title: 'A note that only says true things',
    body: 'The note is written from your resume and nothing else. If Docker is not on your resume, it is not in the note.',
  },
  {
    id: 'tracker',
    title: 'A tracker that remembers',
    body: 'Save the job with its score and its note. Move it from saved to applied to interview as the hunt goes on.',
  },
]

const STAGES = [
  { tone: 'yellow', grow: 1.3, time: 'Once', text: 'First, upload your resume as a PDF.' },
  { tone: 'pink', grow: 1.3, time: 'Seconds', text: 'Then paste the job post.' },
  { tone: 'blue', grow: 2.4, time: 'A few seconds', text: 'Next, the lens scores the match and drafts your note.' },
  { tone: 'ink', grow: 6, time: 'The whole hunt', text: 'Last, the tracker keeps every application and its status until the offer.' },
]

const SAMPLE_ROWS = [
  ['Kaveri Labs', 'Backend Developer', 'Interview', 74],
  ['Nilgiri Software', 'Python Developer', 'Applied', 57],
  ['Bluewater Systems', 'Django Intern', 'Applied', 81],
  ['Tidepool Apps', 'Full Stack Developer', 'Saved', 49],
]

/* ---------- product fragments, built as real pieces of the app ---------- */

function Fragment({ kind }) {
  if (kind === 'score') {
    return (
      <div className="ui" data-ui>
        <div className="ui__head">
          <p className="ui__score">
            <b>57</b>
            <span>Worth applying</span>
          </p>
          <ul className="ui__parts">
            <li>
              <span>Keyword match</span>
              <i style={{ '--w': 0.5 }} />
              <b>50</b>
            </li>
            <li>
              <span>AI read</span>
              <i style={{ '--w': 0.62 }} />
              <b>62</b>
            </li>
          </ul>
        </div>
        <p className="ui__post">
          <Marked text={POST} hits={POST_HITS} misses={POST_MISSES} />
        </p>
      </div>
    )
  }
  if (kind === 'note') {
    return (
      <div className="ui" data-ui>
        <div className="ui__tabs" role="presentation">
          <span>Professional</span>
          <span className="is-on">Friendly</span>
          <span>Confident</span>
        </div>
        <p className="ui__note">
          Hi, I’m a Python developer focused on Django and Django REST Framework, building end-to-end
          products with REST APIs and PostgreSQL. In PingBoard I built a full-stack monitoring service
          and deployed it on Render with Neon PostgreSQL. In ShopFlow I built a multi-vendor store with
          JWT authentication and transaction-safe stock handling.
        </p>
        <p className="ui__foot">
          <span>No Docker, no AWS: neither is on the resume.</span>
          <span className="ui__btn">Copy note</span>
        </p>
      </div>
    )
  }
  return (
    <div className="ui" data-ui>
      <table className="ui__table">
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Status</th>
            <th scope="col" className="num">
              Match
            </th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ROWS.map(([company, role, status, score]) => (
            <tr key={company}>
              <td>
                <b>{company}</b>
                <span>{role}</span>
              </td>
              <td>
                <span className={`chip chip--${status.toLowerCase()}`}>{status}</span>
              </td>
              <td className="num">{score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- the live thing: type what a job asks for ---------- */

function TryIt() {
  const [text, setText] = useState(EXAMPLES[0][1])
  const { asked, matched, missing, score } = useMemo(() => compare(text), [text])
  // Poster size for a few skills, smaller once a whole post is pasted in.
  const size = text.length > 240 ? ' typed--post' : text.length > 44 ? ' typed--long' : ''

  return (
    <section className="try" id="try" aria-labelledby="try-h">
      <h2 id="try-h" className="sr-only">
        Try the lens
      </h2>
      <div className={`typed${size}`} data-ui data-rise>
        <div className="typed__mirror" aria-hidden="true">
          <Marked text={text} hits={matched} misses={missing} />
          {'\u200b'}
        </div>
        <textarea
          className="typed__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Skills a job asks for"
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          rows={1}
        />
      </div>

      <div className="try__grid">
        <div className="try__answer" aria-live="polite" data-rise>
          <p className="try__lead">
            Type the skills a job asks for, or paste the whole post. Yellow is on the sample resume.
            Pink is missing.
          </p>
          <p className="try__score">
            <b>{score ?? '0'}</b>
            <span>
              {asked.length
                ? `${matched.length} of ${asked.length} asked skills are on the sample resume.`
                : 'No skill found yet. Try Django, Docker or React.'}
            </span>
          </p>
          <div className="try__examples">
            {EXAMPLES.map(([label, value]) => (
              <button key={label} type="button" onClick={() => setText(value)} aria-pressed={text === value}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <aside className="slip swipe" data-ui data-rise aria-label="Sample resume">
          <p className="slip__title">Sample resume</p>
          <p className="slip__skills">
            {SAMPLE_RESUME.filter((s) => s !== 'drf').map((skill) =>
              matched.includes(skill) ? (
                <Mk key={`${skill}-on`}>{skill}</Mk>
              ) : (
                <span key={skill}>{skill}</span>
              ),
            )}
          </p>
          <p className="slip__foot">
            The app scores your own resume and adds an AI read of the whole thing.
          </p>
        </aside>
      </div>
    </section>
  )
}

/* ---------- the closing sentence with a blank in it ---------- */

function Close() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  return (
    <section className="close" id="start" aria-labelledby="close-h">
      <form
        className="close__form"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/register', { state: { username: name.trim() } })
        }}
      >
        <h2 id="close-h" className="close__line" data-rise>
          <label htmlFor="close-name">Sign me up as</label>
          <input
            id="close-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            autoComplete="username"
            maxLength={30}
          />
          <button type="submit" className="magnet">Start</button>
        </h2>
        <p className="close__note" data-rise>
          Free to use. Only you can see your resume and your applications.{' '}
          <Link to="/login">Already have an account? Sign in.</Link>
        </p>
      </form>
    </section>
  )
}

const STRIP = ['Python', 'Django', 'REST API', 'PostgreSQL', 'Docker', 'AWS', 'React', 'JWT', 'Redis', 'Celery', 'Git', 'CI/CD']
const STRIP_HAVE = new Set(SAMPLE_RESUME)

export default function Landing() {
  const root = useRef(null)
  const slot = useRef(null)
  // What the 3D sheet is doing. GSAP animates these numbers and the scene reads them every frame.
  // ry/rx/scale belong to the load animation, spin/tilt/grow/scan belong to the scroll.
  const sheet = useRef({ reveal: 0, scan: 0, opacity: 0, rx: 0.08, ry: -0.42, rz: 0.03, scale: 1, spin: 0, tilt: 0, grow: 0, lift: 0, z: 0 })
  const { status } = useAuth()
  const signedIn = status === 'in'

  // Smooth scroll, driven by GSAP's clock so every scroll animation stays in step with it.
  useEffect(() => {
    if (!window.matchMedia(MOTION_OK).matches) return undefined
    const lenis = new Lenis({ duration: 1.1, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  useGSAP(
    (context, contextSafe) => {
      const stage = gsap.utils.toArray('.story__stage .story__frag')
      const move = window.matchMedia(MOTION_OK).matches
      const s = sheet.current

      // The pinned story: one frame holds, its screen changes with the step beside it.
      const show = contextSafe((index) => {
        stage.forEach((el, i) => {
          gsap.to(el, {
            autoAlpha: i === index ? 1 : 0,
            y: i === index || !move ? 0 : 28,
            scale: i === index || !move ? 1 : 0.97,
            duration: move ? 0.55 : 0,
            ease: 'power3.out',
            overwrite: true,
          })
        })
      })
      gsap.set(stage, { autoAlpha: 0 })
      show(0)
      gsap.utils.toArray('.story__step').forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && show(i),
        })
      })

      if (!move) {
        Object.assign(s, { reveal: 1, scan: 1, opacity: 1 })
        document.fonts?.ready.then(() => ScrollTrigger.refresh())
        return undefined
      }

      // Load: the headline arrives letter by letter while the resume swings in and writes itself.
      const hero = SplitText.create('.hero__word', { type: 'chars' })
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from(hero.chars, { yPercent: 118, rotation: 5, duration: 1.1, stagger: 0.02 })
        .from('.nav > *', { y: -14, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.15)
        .from('.hero__sub > *', { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, 0.45)
        .to(s, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.1)
        .from(s, { ry: -1.7, rx: 0.55, scale: 0.78, duration: 2, ease: 'expo.out' }, 0.1)
        .to(s, { reveal: 1, duration: 2.4, ease: 'power1.inOut' }, 0.35)

      // Scroll: the sheet turns to face you, grows, and the scan bar runs down it.
      gsap
        .timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: 0.5 } })
        .to(s, { spin: 0.85, tilt: -0.1, grow: 0.1, ease: 'none' }, 0)
        .to(s, { scan: 1, ease: 'none' }, 0.04)
      gsap.to('.hero__copy', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      })

      // Reading progress along the top edge.
      gsap.to('.progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      })

      // Section headings arrive letter by letter, the rest of each section follows in reading order.
      gsap.utils.toArray('.lp section:not(.hero)').forEach((section) => {
        const head = section.querySelector('.head')
        if (head) {
          const split = SplitText.create(head, { type: 'words,chars' })
          gsap.from(split.chars, {
            yPercent: 70,
            autoAlpha: 0,
            rotationX: -70,
            transformOrigin: '50% 100%',
            duration: 0.8,
            ease: 'expo.out',
            stagger: 0.018,
            scrollTrigger: { trigger: head, start: 'top 86%', once: true },
          })
        }
        const parts = section.querySelectorAll('[data-rise]:not(.head)')
        if (!parts.length) return
        gsap.from(parts, {
          y: 34,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: section, start: 'top 76%', once: true },
        })
      })

      // The stages bar draws itself left to right.
      gsap.from('.stages__seg', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.9,
        ease: 'power4.inOut',
        stagger: 0.12,
        scrollTrigger: { trigger: '.stages__bar', start: 'top 80%', once: true },
      })
      gsap.from('.stages__seg > *, .stages__notes li', {
        autoAlpha: 0,
        y: 12,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.5,
        scrollTrigger: { trigger: '.stages__bar', start: 'top 80%', once: true },
      })

      // The two weights of the score fill to their share.
      gsap.from('.formula__w i', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1,
        ease: 'expo.out',
        stagger: 0.15,
        scrollTrigger: { trigger: '.formula', start: 'top 65%', once: true },
      })

      // The address in the footer rises line by line.
      gsap.from('.foot__word', {
        yPercent: 110,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.foot__contact', start: 'top 92%', once: true },
      })

      // Buttons lean toward the pointer, then spring back.
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      const magnets = fine ? gsap.utils.toArray('.magnet') : []
      const offs = magnets.map((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
        const onMove = (e) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * 0.28)
          yTo((e.clientY - (r.top + r.height / 2)) * 0.36)
        }
        const onLeave = () => {
          xTo(0)
          yTo(0)
        }
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        return () => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
        }
      })

      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => offs.forEach((off) => off())
    },
    { scope: root },
  )

  return (
    <div className="lp" ref={root} id="top">
      <Backdrop />
      <ResumeScene slot={slot} state={sheet} />
      <div className="progress" aria-hidden="true" />
      <header className="nav">
        <Link to="/" className="nav__brand" aria-label="HireLens home">
          <Logo />
          <span>HireLens</span>
        </Link>
        <nav className="nav__links" aria-label="Sections">
          <a href="#try">Try it</a>
          <a href="#story">What you get</a>
          <a href="#stages">How it works</a>
        </nav>
        <Link to={signedIn ? '/app/match' : '/login'} className="btn btn--ghost nav__action magnet">
          {signedIn ? 'Open app' : 'Sign in'}
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <h1 className="hero__h">
              <span className="mask">
                <span className="hero__word">See your fit</span>
              </span>
              <span className="mask">
                <span className="hero__word">before you apply</span>
              </span>
            </h1>
            <div className="hero__sub">
              <p>
                HireLens reads a job post against your resume. You get a match score, the skills you
                are missing and a note you can send, then it tracks every application.
              </p>
              <div className="hero__actions">
                <Link to={signedIn ? '/app/match' : '/register'} className="btn magnet">
                  {signedIn ? 'Open the app' : 'Check a job post'}
                </Link>
                <a href="#try" className="hero__link">
                  Try it without an account
                </a>
              </div>
            </div>
          </div>
          <div className="hero__slot" ref={slot} aria-hidden="true" />
        </section>

        <div className="strip" aria-hidden="true">
          <div className="strip__track">
            {[0, 1].map((copy) => (
              <span className="strip__set" key={copy}>
                {STRIP.map((skill) => (
                  <Mk key={skill} kind={STRIP_HAVE.has(skill.toLowerCase()) ? 'hit' : 'miss'}>
                    {skill}
                  </Mk>
                ))}
              </span>
            ))}
          </div>
        </div>

        <TryIt />

        <section className="story" id="story" aria-labelledby="story-h">
          <h2 id="story-h" className="head" data-rise>
            One match, three things back
          </h2>
          <div className="story__grid">
            <div className="story__stage" aria-hidden="true">
              {STEPS.map((step) => (
                <div className="story__frag" key={step.id}>
                  <Fragment kind={step.id} />
                </div>
              ))}
            </div>
            <ol className="story__steps">
              {STEPS.map((step) => (
                <li className="story__step" key={step.id}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="story__inline">
                    <Fragment kind={step.id} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="stages" id="stages" aria-labelledby="stages-h">
          <h2 id="stages-h" className="head" data-rise>
            You paste. It does the rest.
          </h2>
          <div className="stages__bar" data-ui>
            {STAGES.map((s) => (
              <div className={`stages__seg stages__seg--${s.tone}`} style={{ flexGrow: s.grow }} key={s.time}>
                <b>{s.time}</b>
                <span className="stages__in">{s.text}</span>
              </div>
            ))}
          </div>
          <ol className="stages__notes">
            {STAGES.map((s) => (
              <li style={{ flexGrow: s.grow }} key={s.time}>
                {s.text}
              </li>
            ))}
          </ol>
        </section>

        <section className="formula" aria-labelledby="formula-h">
          <h2 id="formula-h" className="head" data-rise>
            How the score is made
          </h2>
          <div className="formula__body">
            <p className="formula__say" data-rise>
              The score is 40%{' '}
              <span className="formula__w" aria-hidden="true">
                <i style={{ '--w': 0.4 }} />
              </span>{' '}
              a keyword match you can audit and 60%{' '}
              <span className="formula__w" aria-hidden="true">
                <i style={{ '--w': 0.6 }} />
              </span>{' '}
              an AI read of your whole resume.
            </p>
            <pre className="formula__code" data-rise>
              <code>final_score = round(0.4 * kw_score + 0.6 * ai_score)</code>
            </pre>
            <p className="formula__more" data-rise>
              PDFs are read with pypdf. Accounts use JWT. The API is Django REST Framework, the model
              answers in strict JSON, and every resume and application is scoped to its owner.
            </p>
          </div>
        </section>

        <Close />
      </main>

      <footer className="foot">
        <div className="foot__top">
          <p>HireLens is a portfolio project by Mohanraj S.</p>
          <p>Built with Django REST Framework, React and GSAP.</p>
          <a href="#top">Back to top</a>
        </div>
        <a className="foot__contact" href="https://github.com/mohanrajtunes/hirelens">
          <span className="mask">
            <span className="foot__word">github.com/</span>
          </span>
          <span className="mask">
            <span className="foot__word">
              mohanrajtunes/
              <wbr />
              hirelens
            </span>
          </span>
        </a>
        <div className="foot__meta">
          <p>
            <Link to="/login">Sign in</Link> <Link to="/register">Create account</Link>
          </p>
          <p>Set in Big Shoulders and Public Sans</p>
          <p>2026</p>
        </div>
      </footer>
    </div>
  )
}
