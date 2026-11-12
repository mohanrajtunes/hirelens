import { useRef } from 'react'
import { gsap } from '../lib/motion.js'
import { segment } from '../lib/skills.js'
import { RESUME } from '../lib/resume.js'

// The resume as a flat, clean page. It is real text, so it stays sharp and a
// screen reader can read it. A scan line passes over it during a check.
export default function Paper({ children, className = '', paperRef }) {
  const own = useRef(null)
  return (
    <div className={`paper ${className}`} ref={paperRef || own}>
      <div className="paper__page">{children}</div>
      <div className="paper__scan" aria-hidden="true" />
    </div>
  )
}

// The page rises in, then a scan line travels down it and the text appears behind the line.
export function unfoldTl(root) {
  const page = root.querySelector('.paper__page')
  return gsap
    .timeline()
    .fromTo(root, { y: 40, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' })
    .set(root, { '--scan-on': 1 }, 0.25)
    .fromTo(page, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut' }, 0.25)
    .fromTo(root, { '--scan': 0 }, { '--scan': 1, duration: 1.2, ease: 'power2.inOut' }, 0.25)
    .to(root, { '--scan-on': 0, duration: 0.25 })
    .set(page, { clearProps: 'clipPath' })
}

// Sweep the scan line down the page. A skill lights up as the line passes it.
export function scanTl(root, { duration = 1.5 } = {}) {
  const marks = [...root.querySelectorAll('.pm')]
  const height = root.offsetHeight || 1
  const at = marks.map((m) => Math.min(1, (m.offsetTop + m.offsetHeight / 2) / height))
  const state = { p: 0 }
  const apply = () => {
    root.style.setProperty('--scan', state.p)
    marks.forEach((m, i) => m.classList.toggle('on', state.p >= at[i]))
  }
  return gsap
    .timeline()
    .set(root, { '--scan-on': 1 })
    .fromTo(state, { p: 0 }, { p: 1, duration, ease: 'none', onUpdate: apply })
    .to(root, { '--scan-on': 0, duration: 0.25 })
}

// Show everything at once, for visitors who asked for reduced motion.
export function showPaper(root) {
  gsap.set(root, { '--scan-on': 0, autoAlpha: 1 })
  root.querySelectorAll('.pm').forEach((m) => m.classList.add('on'))
}

const Words = ({ text, hits }) =>
  segment(text, hits, []).map((part, i) =>
    part.kind ? (
      <span className="pm" key={i}>
        {part.text}
      </span>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  )

// The builder's own resume, laid out like a real one. Skills that the job
// post asks for are wrapped so the scan can light them.
export function ResumeDoc({ hits = [], resume = RESUME }) {
  const asked = new Set(hits.map((h) => h.toLowerCase()))
  return (
    <article className="cv">
      <header className="cv__head">
        <h3>{resume.name}</h3>
        <p className="cv__role">{resume.role}</p>
        <p className="cv__meta">{resume.meta.join('  /  ')}</p>
      </header>
      <section>
        <h4>Profile</h4>
        <p>
          <Words text={resume.summary} hits={hits} />
        </p>
      </section>
      <section>
        <h4>Skills</h4>
        <ul className="cv__skills">
          {resume.skills.map((s) => (
            <li key={s}>{asked.has(s.toLowerCase()) ? <span className="pm">{s}</span> : s}</li>
          ))}
        </ul>
      </section>
      <section>
        <h4>Projects</h4>
        {resume.projects.map((p) => (
          <p className="cv__proj" key={p.name}>
            <b>{p.name}</b> <Words text={p.line} hits={hits} />
          </p>
        ))}
      </section>
      <section>
        <h4>Education</h4>
        <p>{resume.education}</p>
      </section>
    </article>
  )
}

// A plain-text resume (what the PDF reader extracted), marked the same way.
export function TextDoc({ text, hits = [], name = 'resume.pdf' }) {
  return (
    <article className="cv cv--text">
      <p className="cv__file">{name}</p>
      <p className="cv__raw">
        <Words text={text || ''} hits={hits} />
      </p>
    </article>
  )
}
