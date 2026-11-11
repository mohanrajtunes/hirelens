import { useEffect, useRef, useState } from 'react'
import { gsap, SplitText } from '../../lib/motion.js'
import { useReveals } from '../../lib/reveal.js'
import { setScene } from '../../lib/scene.js'
import { TLink } from '../../lib/nav.jsx'
import { Em, Icon } from '../../components/bits.jsx'
import ScoreRing from '../../components/ScoreRing.jsx'

const LIMITS = [
  ['Sign in', '5 a minute'],
  ['Create account', '10 an hour'],
  ['Upload resume', '20 an hour'],
  ['AI match and note', '30 an hour'],
]

const TOOLS = ['Django 6', 'Django REST Framework', 'SimpleJWT', 'pypdf', 'Groq LLM', 'SQLite', 'React 19', 'Vite', 'GSAP', 'Three.js', 'Lenis']

const RESPONSE = `{
  "final_score": 71,
  "keyword_score": 60,
  "ai_score": 78,
  "matched_skills": ["python", "django", "jwt"],
  "missing_skills": ["docker", "aws"],
  "tips": ["Add any Docker work, even a side project."]
}`

function Limiter() {
  const [tries, setTries] = useState(0)
  const box = useRef(null)
  const blocked = tries > 5
  const hit = () => {
    setTries((t) => Math.min(t + 1, 6))
    if (tries >= 5) gsap.fromTo(box.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)' })
  }
  return (
    <div className="limiter" ref={box}>
      <p className="mono limiter__req">POST /api/auth/login/</p>
      <ol aria-label="Sign-in attempts this minute">
        {[1, 2, 3, 4, 5].map((n) => (
          <li key={n} className={tries >= n ? 'is-used' : ''} />
        ))}
      </ol>
      <p className={`mono limiter__res${blocked ? ' is-blocked' : ''}`} aria-live="polite">
        {blocked ? '429 Too Many Requests. Wait a minute.' : tries ? `401 Unauthorized. ${5 - tries} left.` : 'Guess a password. Go on.'}
      </p>
      <div className="limiter__row">
        <button type="button" className="btn btn--small" onClick={hit} disabled={blocked}>
          Try a password
        </button>
        {tries > 0 && (
          <button type="button" className="link" onClick={() => setTries(0)}>
            A minute later
          </button>
        )}
      </div>
    </div>
  )
}

export default function Stack() {
  const root = useRef(null)
  const [kw, setKw] = useState(60)
  const [ai, setAi] = useState(78)
  const final = Math.round(0.4 * kw + 0.6 * ai)

  useEffect(() => setScene({ power: 0.9, shift: 6 }), [])

  useReveals(root, (ok) => {
    if (!ok) return
    SplitText.create('.top h1', {
      type: 'chars',
      mask: 'chars',
      onSplit: (self) => gsap.from(self.chars, { yPercent: 120, duration: 1, ease: 'expo.out', stagger: 0.03, delay: 0.2 }),
    })
    gsap.from('.flow__node', {
      scale: 0.6,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'back.out(1.8)',
      stagger: 0.12,
      scrollTrigger: { trigger: '.flow', start: 'top 75%', once: true },
    })
    gsap.from('.flow__pipe', {
      scaleX: 0,
      scaleY: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.2,
      scrollTrigger: { trigger: '.flow', start: 'top 75%', once: true },
    })
    gsap.utils.toArray('.term__line').forEach((el, i) =>
      gsap.to(el, {
        duration: 0.9,
        delay: i * 0.13,
        scrambleText: { text: el.textContent, chars: '01{}[]":,', speed: 0.7 },
        ease: 'none',
        scrollTrigger: { trigger: '.term', start: 'top 75%', once: true },
      }),
    )
  })

  return (
    <div ref={root}>
      <section className="top">
        <p className="tag">
          <i /> Under the hood
        </p>
        <h1>
          No magic. <Em>Just parts.</Em>
        </h1>
        <p className="top__sub" data-rise>
          A Django REST API, a PDF reader, a keyword matcher and one LLM call. Here is each part and what it does.
        </p>
      </section>

      <section className="sec sec--flow">
        <h2 className="sr-only">How a match request flows</h2>
        <div className="flow">
          <div className="flow__node glass">
            <b>Your browser</b>
            <span>React, Vite. Sends the job post with a JWT.</span>
          </div>
          <i className="flow__pipe" aria-hidden="true" />
          <div className="flow__node glass">
            <b>Django REST API</b>
            <span>Checks the token, the rate limit and that the resume is yours.</span>
          </div>
          <i className="flow__pipe" aria-hidden="true" />
          <div className="flow__split">
            <div className="flow__node glass flow__node--lime">
              <b>Keyword match</b>
              <span>48 skills, whole-word matching. 40% of the score.</span>
            </div>
            <div className="flow__node glass flow__node--violet">
              <b>LLM read</b>
              <span>Groq reads both texts and answers in JSON. 60% of the score.</span>
            </div>
          </div>
          <i className="flow__pipe" aria-hidden="true" />
          <div className="flow__node glass flow__node--out">
            <b>One answer</b>
            <span>Score, matched, missing, tips and strengths.</span>
          </div>
        </div>
      </section>

      <section className="sec split">
        <div>
          <h2 data-split>
            The score is <Em>simple maths.</Em>
          </h2>
          <p data-rise>
            Move the two sliders. Keywords alone are easy to game, and an AI alone can drift, so the score mixes both and
            shows you each part.
          </p>
          <p className="formula mono" data-rise>
            round(<b>0.4</b> × {kw} + <b>0.6</b> × {ai}) = <strong>{final}</strong>
          </p>
        </div>
        <div className="mix glass" data-rise>
          <ScoreRing value={final} size={180} caption="final score" />
          <label className="range">
            <span>
              Keyword match <b>{kw}</b>
            </span>
            <input type="range" min="0" max="100" value={kw} onChange={(e) => setKw(+e.target.value)} style={{ '--v': kw }} />
          </label>
          <label className="range range--violet">
            <span>
              AI read <b>{ai}</b>
            </span>
            <input type="range" min="0" max="100" value={ai} onChange={(e) => setAi(+e.target.value)} style={{ '--v': ai }} />
          </label>
        </div>
      </section>

      <section className="sec split split--flip">
        <div className="glass limits" data-rise>
          <Limiter />
          <table>
            <caption className="sr-only">Rate limits per user</caption>
            <tbody>
              {LIMITS.map(([what, rate]) => (
                <tr key={what}>
                  <th scope="row">{what}</th>
                  <td className="mono">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 data-split>
            Locked, <Em>on purpose.</Em>
          </h2>
          <p data-rise>
            Every door has a counter on it. Press the button six times and watch the API stop answering, the same way the
            real one does.
          </p>
        </div>
      </section>

      <section className="sec split">
        <div>
          <h2 data-split>
            One call, <Em>one answer.</Em>
          </h2>
          <p data-rise>The front end is only a reader. Anything it shows, you can get from the API with a token.</p>
          <ul className="tools">
            {TOOLS.map((t) => (
              <li className="chip" key={t} data-pop>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="term glass" data-rise>
          <p className="term__bar mono">
            <i />
            <i />
            <i />
            <span>POST /api/ai/match/ 200 OK</span>
          </p>
          <pre>
            <code className="mono">
              {RESPONSE.split('\n').map((line) => (
                <span className="term__line" key={line} style={{ paddingLeft: `${line.length - line.trimStart().length}ch` }}>
                  {line.trim()}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </section>

      <section className="close">
        <h2 data-split>
          Read the <Em>source.</Em>
        </h2>
        <div className="hero__cta" data-rise>
          <a className="btn magnet" href="https://github.com/mohanrajtunes/hirelens" target="_blank" rel="noreferrer">
            <Icon name="github" /> Open on GitHub
          </a>
          <TLink to="/why" className="btn btn--ghost magnet">
            Why it exists
          </TLink>
        </div>
      </section>
    </div>
  )
}
