import { useRef } from 'react'
import { gsap, motionOK, ScrollTrigger, SplitText, useGSAP } from '../lib/motion.js'
import { TLink } from '../lib/nav.jsx'
import { Logo } from '../components/bits.jsx'
import '../styles/built.css'

// For people who want to see the engineering: what happens on a match request,
// the API routes, the stack and a few decisions. Linked from the footer only.
const STEPS = [
  ['The browser sends the job', 'The React app posts the job description and the id of a saved resume to POST /api/ai/match/, with a short-lived access token.'],
  ['The API checks the request', 'Django REST Framework verifies the JWT, applies a rate limit and loads the resume text that was extracted when the PDF was uploaded.'],
  ['Two checks run on the same text', 'A keyword check finds the skills the job asks for and looks for each one in the resume. An LLM reads both texts and replies in strict JSON: a score, strengths, gaps and tips.'],
  ['One score comes back', 'The two scores are combined, 40% keywords and 60% LLM, and returned as JSON. The page marks up the post and fills the score ring.'],
]
const ROUTES = [
  ['POST', '/api/auth/register/', 'Create an account. Passwords go through Django\'s validators.'],
  ['POST', '/api/auth/login/', 'Returns an access token (15 min) and a refresh token (1 day).'],
  ['POST', '/api/auth/refresh/', 'Swaps the refresh token. The old one is blacklisted.'],
  ['POST', '/api/auth/logout/', 'Blacklists the refresh token.'],
  ['GET', '/api/auth/me/', 'The signed-in user.'],
  ['GET POST', '/api/resumes/', 'List resumes, or upload a PDF (2 MB limit). Text is extracted once with pypdf.'],
  ['DELETE', '/api/resumes/:id/', 'Remove a resume. Users can only reach their own.'],
  ['POST', '/api/ai/match/', 'Keyword check plus LLM review. Returns score, matched and missing skills, tips.'],
  ['POST', '/api/ai/cover-note/', 'Writes a note in the chosen tone, using only facts from the resume.'],
  ['GET POST', '/api/jobs/', 'The tracker: list applications or save one with its score and note.'],
  ['PATCH DELETE', '/api/jobs/:id/', 'Move an application to another stage, edit it or delete it.'],
]
const STACK = [
  ['Frontend', 'React, Vite, React Router, GSAP, Axios'],
  ['API', 'Python, Django, Django REST Framework, SimpleJWT'],
  ['AI', 'Groq LLM API, structured JSON output, pypdf'],
  ['Data', 'PostgreSQL on Neon'],
  ['Hosting', 'Vercel (frontend), Render (API)'],
]
const WHY = [
  ['Two scores, not one', 'An LLM alone gives slightly different numbers each run. Keywords alone miss context. Mixing them keeps the score steady and still sensible.'],
  ['Notes that cannot invent', 'The cover note prompt allows only facts found in the resume and admits at most one missing skill, so it never claims experience the person lacks.'],
  ['Read the PDF once', 'Resume text is extracted at upload and stored, so every later match is one database read and one LLM call.'],
  ['Limits where money is spent', 'AI routes are limited per user per hour, and sign-in per minute, so the LLM quota and accounts are protected.'],
]

// Node boxes in the diagram: [id, x, y, w, title, subtitle]
const NODES = [
  ['browser', 20, 160, 160, 'Browser', 'React app'],
  ['api', 270, 160, 170, 'Django API', 'JWT, rate limit'],
  ['kw', 540, 50, 180, 'Keyword check', 'skill list, regex'],
  ['llm', 540, 270, 180, 'LLM review', 'Groq, JSON only'],
  ['score', 820, 160, 160, 'Final score', '40% + 60%'],
]
const PATHS = {
  p1: 'M180 200 H270',
  p2: 'M440 200 C490 200 490 90 540 90',
  p3: 'M440 200 C490 200 490 310 540 310',
  p4: 'M720 90 C770 90 770 200 820 200',
  p5: 'M720 310 C770 310 770 200 820 200',
  p6: 'M900 240 V372 H100 V240',
}

export default function Built() {
  const root = useRef(null)

  useGSAP(
    () => {
      const el = root.current
      const q = (s) => el.querySelector(s)
      const all = (s) => gsap.utils.toArray(el.querySelectorAll(s))
      const steps = all('.b-steps li')
      const setStep = (n) => steps.forEach((s, i) => s.classList.toggle('on', i === n))
      const node = (id, on) => q(`.b-node[data-id="${id}"]`).classList.toggle('on', on)
      const num = q('.b-num')

      if (!motionOK()) {
        steps.forEach((s) => s.classList.add('on'))
        all('.b-node').forEach((n) => n.classList.add('on'))
        num.textContent = '72'
        return
      }

      SplitText.create('.b-hero h1', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
      })
      gsap.from('.b-hero p, .b-flow', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.25 })
      gsap.from('.b-wire--back', { autoAlpha: 0, duration: 1, delay: 1.2 })
      gsap.from('.b-wire:not(.b-wire--back)', { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.08, delay: 0.5 })
      gsap.from('.b-node', { scale: 0.8, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(1.6)', stagger: 0.08, delay: 0.4 })

      // A packet travels the request, step by step, and the loop repeats.
      const dots = all('.b-dot')
      gsap.set(dots, { autoAlpha: 0 })
      const run = (dot, path, at, tl, dur = 0.9) =>
        tl
          .set(dot, { autoAlpha: 1 }, at)
          .to(dot, { motionPath: { path: q(`#${path}`), align: q(`#${path}`), alignOrigin: [0.5, 0.5] }, duration: dur, ease: 'power1.inOut' }, at)
          .set(dot, { autoAlpha: 0 }, at + dur)
      const s = { n: 0 }
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.6, paused: true })
      tl.call(() => {
        all('.b-node').forEach((n) => n.classList.remove('on'))
        num.textContent = '0'
        s.n = 0
        setStep(0)
        node('browser', true)
      }, null, 0)
      run(dots[0], 'p1', 0.3, tl)
      tl.call(() => (setStep(1), node('api', true)), null, 1.2)
      run(dots[0], 'p2', 2.3, tl)
      run(dots[1], 'p3', 2.3, tl)
      tl.call(() => setStep(2), null, 2.3)
      tl.call(() => (node('kw', true), node('llm', true)), null, 3.2)
      run(dots[0], 'p4', 4.4, tl)
      run(dots[1], 'p5', 4.4, tl)
      tl.call(() => (setStep(3), node('score', true)), null, 5.3)
      tl.to(s, { n: 72, duration: 0.9, ease: 'power2.out', onUpdate: () => (num.textContent = Math.round(s.n)) }, 5.3)
      run(dots[0], 'p6', 6.3, tl, 1.5)
      tl.to({}, { duration: 1.2 })
      ScrollTrigger.create({ trigger: '.b-flow', start: 'top 85%', end: 'bottom 10%', onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) })

      all('.b-sec').forEach((sec) => {
        gsap.from(sec.querySelectorAll('h2, .b-lead'), { y: 26, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: sec, start: 'top 82%', once: true } })
        gsap.from(sec.querySelectorAll('.b-rise'), { y: 30, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: sec, start: 'top 72%', once: true } })
      })
    },
    { scope: root },
  )

  return (
    <div className="b-root" ref={root}>
      <header className="b-top b-wrap">
        <TLink to="/" className="b-brand">
          <Logo />
          HireLens
        </TLink>
        <nav>
          <TLink to="/sample">Sample match</TLink>
          <a href="https://github.com/mohanrajtunes/hirelens" target="_blank" rel="noreferrer" className="b-btn">
            Source on GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="b-hero b-wrap">
          <p className="b-eyebrow">How it is built</p>
          <h1>What happens when you click Analyse match.</h1>
          <p className="b-lead">One request, two checks, one score. This page is for anyone who wants to see the engineering behind HireLens.</p>

          <div className="b-flow">
            <svg className="b-svg" viewBox="0 0 1000 400" role="img" aria-label="Diagram: the browser calls the Django API, which runs a keyword check and an LLM review and returns one score">
              {Object.entries(PATHS).map(([id, d]) => (
                <path key={id} id={id} className={`b-wire${id === 'p6' ? ' b-wire--back' : ''}`} d={d} />
              ))}
              <text className="b-tag" x="225" y="186" textAnchor="middle">POST</text>
              <text className="b-tag" x="225" y="222" textAnchor="middle">/ai/match/</text>
              <text className="b-tag" x="500" y="392" textAnchor="middle">JSON response</text>
              {NODES.map(([id, x, y, w, t, sub]) => (
                <g className="b-node" data-id={id} key={id}>
                  <rect x={x} y={y} width={w} height="80" rx="16" />
                  <text className="b-node__t" x={x + w / 2} y={y + 35} textAnchor="middle">
                    {id === 'score' ? (
                      <>
                        Score <tspan className="b-num">0</tspan>
                      </>
                    ) : (
                      t
                    )}
                  </text>
                  <text className="b-node__s" x={x + w / 2} y={y + 58} textAnchor="middle">
                    {sub}
                  </text>
                </g>
              ))}
              <circle className="b-dot" r="7" />
              <circle className="b-dot" r="7" />
            </svg>

            <ol className="b-steps">
              {STEPS.map(([t, d], i) => (
                <li key={t}>
                  <span>0{i + 1}</span>
                  <b>{t}</b>
                  <em>{d}</em>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="b-sec b-wrap">
          <h2>The API routes.</h2>
          <p className="b-lead">A REST API. Every route except register and login needs a valid token, and every query is filtered to the signed-in user.</p>
          <ul className="b-routes">
            {ROUTES.map(([m, path, d]) => (
              <li className="b-rise" key={m + path}>
                <span className="b-methods">
                  {m.split(' ').map((x) => (
                    <i key={x} data-m={x}>
                      {x}
                    </i>
                  ))}
                </span>
                <code>{path}</code>
                <em>{d}</em>
              </li>
            ))}
          </ul>
        </section>

        <section className="b-sec b-dark">
          <div className="b-wrap">
            <h2>Decisions behind it.</h2>
            <div className="b-why">
              {WHY.map(([t, d], i) => (
                <article className="b-rise" key={t}>
                  <span>0{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="b-sec b-wrap">
          <h2>Built with.</h2>
          <dl className="b-stack">
            {STACK.map(([k, v]) => (
              <div className="b-rise" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="b-cta b-rise">
            <TLink to="/sample" className="b-btn b-btn--big">
              Try a sample match
            </TLink>
            <a href="https://github.com/mohanrajtunes/hirelens" target="_blank" rel="noreferrer">
              Read the code on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="b-wrap b-foot">
        <span>© 2026 HireLens</span>
        <span>
          Built by{' '}
          <a href="https://github.com/mohanrajtunes" target="_blank" rel="noreferrer">
            Mohanraj S
          </a>
        </span>
      </footer>
    </div>
  )
}
