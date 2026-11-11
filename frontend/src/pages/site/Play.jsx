import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { useReveals } from '../../lib/reveal.js'
import { setScene } from '../../lib/scene.js'
import { confetti } from '../../lib/fun.js'
import { compare, segment } from '../../lib/skills.js'
import { POSTS, RESUME } from '../../lib/resume.js'
import { TLink } from '../../lib/nav.jsx'
import { Em, Icon } from '../../components/bits.jsx'
import Paper, { ResumeDoc, scanTl, showPaper, unfoldTl } from '../../components/Paper.jsx'
import ScoreRing from '../../components/ScoreRing.jsx'

const HAVE = RESUME.skills.map((s) => s.toLowerCase())

const LINES = [
  [75, 'Strong match.'],
  [50, 'Good match with some gaps.'],
  [1, 'Low match. Several requirements are missing.'],
  [0, 'No matching skills found.'],
]

export default function Play() {
  const root = useRef(null)
  const paper = useRef(null)
  const opened = useRef(false)
  const wasHigh = useRef(false)
  const [text, setText] = useState(POSTS[0].text)
  const [read, setRead] = useState(POSTS[0].text) // the text last scanned, a beat behind typing
  const fit = useMemo(() => compare(read, HAVE), [read])
  const parts = useMemo(() => segment(text, HAVE, compare(text, HAVE).missing), [text])
  const mirror = useRef(null)

  useEffect(() => setScene({ power: 0.8, shift: 4 }), [])
  useEffect(() => {
    const id = setTimeout(() => setRead(text), 450)
    return () => clearTimeout(id)
  }, [text])

  useReveals(root)

  // Every new read: open the letter the first time, then scan it again.
  useGSAP(
    () => {
      const sheet = paper.current
      if (!motionOK()) {
        showPaper(sheet)
        return
      }
      const tl = gsap.timeline()
      if (!opened.current) {
        opened.current = true
        tl.add(unfoldTl(sheet), 0.3)
      }
      tl.add(scanTl(sheet, { duration: 1.1 }))
      const high = fit.score != null && fit.score >= 75
      if (high && !wasHigh.current) {
        tl.call(() => {
          const r = root.current.querySelector('.ring').getBoundingClientRect()
          confetti(r.left + r.width / 2, r.top + r.height / 2)
        })
      }
      wasHigh.current = high
    },
    { scope: root, dependencies: [read] },
  )

  const line = fit.score == null ? 'Paste a job description to begin.' : LINES.find(([min]) => fit.score >= min)[1]

  return (
    <div ref={root} className="play">
      <section className="top top--tight">
        <p className="tag">
          <i /> Demo
        </p>
        <h1 data-split>
          Try it with a <Em>sample resume.</Em>
        </h1>
        <p className="top__sub">
          Paste a job description to run the keyword match in your browser against a sample resume. Sign in to use
          your own resume and the full AI assessment.
        </p>
      </section>

      <section className="play__grid">
        <div className="play__left glass" data-rise>
          <div className="play__picks" role="group" aria-label="Sample job posts">
            {POSTS.map((p) => (
              <button type="button" key={p.id} className="chip" aria-pressed={text === p.text} onClick={() => setText(p.text)}>
                {p.label}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => setText('')}>
              Clear
            </button>
          </div>
          <div className="typer">
            <div className="typer__mirror" ref={mirror} aria-hidden="true">
              {parts.map((p, i) => (p.kind ? <mark className={`is-${p.kind}`} key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
              {'\n'}
            </div>
            <textarea
              aria-label="Job post"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={(e) => (mirror.current.scrollTop = e.target.scrollTop)}
              placeholder="Paste a job description here."
              spellCheck="false"
              data-lenis-prevent
            />
          </div>
          <p className="play__legend">
            <span className="chip chip--hit">on the resume</span>
            <span className="chip chip--miss">missing</span>
          </p>
        </div>

        <div className="play__paper">
          <Paper paperRef={paper} stamps={fit.missing.slice(0, 5)}>
            <ResumeDoc hits={fit.matched} />
          </Paper>
        </div>

        <aside className="play__out glass" aria-live="polite" data-rise>
          <ScoreRing value={fit.score} size={170} caption="keyword match" />
          <p className="play__line">{line}</p>
          <dl>
            <div>
              <dt>Asked for</dt>
              <dd>{fit.asked.length}</dd>
            </div>
            <div>
              <dt>You have</dt>
              <dd className="is-hit">{fit.matched.length}</dd>
            </div>
            <div>
              <dt>Missing</dt>
              <dd className="is-miss">{fit.missing.length}</dd>
            </div>
          </dl>
          <TLink to="/register" className="btn magnet">
            Use your own resume <Icon name="arrow" />
          </TLink>
        </aside>
      </section>
    </div>
  )
}
