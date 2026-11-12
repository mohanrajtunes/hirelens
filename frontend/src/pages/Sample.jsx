import { useRef, useState } from 'react'
import { gsap, motionOK, useGSAP } from '../lib/motion.js'
import { TLink } from '../lib/nav.jsx'
import { useAuth } from '../lib/auth.jsx'
import { verdict } from '../lib/jobs.js'
import { SAMPLES, SAMPLE_RESUME } from '../lib/sample.js'
import { Em, Icon, Logo, Marked, Skel } from '../components/bits.jsx'
import Paper, { scanTl, showPaper, TextDoc, unfoldTl } from '../components/Paper.jsx'
import ScoreRing from '../components/ScoreRing.jsx'
import '../styles/app.css'

const TONES = ['professional', 'friendly', 'confident']
const wait = (ms) => new Promise((done) => setTimeout(done, ms))

// The Match page with a sample resume and sample jobs, open to anyone.
// Results are prepared in advance: nothing is uploaded, sent or saved.
export default function Sample() {
  const { status } = useAuth()
  const [pick, setPick] = useState(SAMPLES[0].id)
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState(null)
  const [score, setScore] = useState(null)
  const [tone, setTone] = useState('professional')
  const [note, setNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const root = useRef(null)
  const paper = useRef(null)
  const job = SAMPLES.find((s) => s.id === pick)
  const own = status === 'in' ? '/app/match' : '/register'

  useGSAP(
    () => {
      if (!motionOK()) return showPaper(paper.current)
      unfoldTl(paper.current)
      gsap.from('.title > *, .match .panel', { y: 36, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 })
    },
    { scope: root },
  )

  // A result arrives: scan the page, then show the score and the rest.
  useGSAP(
    () => {
      if (!live) return
      if (!motionOK()) {
        showPaper(paper.current)
        setScore(live.final_score)
        return
      }
      gsap
        .timeline()
        .set('.read > *', { autoAlpha: 0, y: 40 })
        .add(scanTl(paper.current, { duration: 1.3 }))
        .call(() => {
          paper.current?.querySelectorAll('.pm').forEach((m) => m.classList.add('on'))
          setScore(live.final_score)
        }, null, '-=0.5')
        .to('.read > *', { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, '<0.1')
        .from('.read .post .mk', { scale: 0.3, autoAlpha: 0, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.035 }, '-=0.35')
        .from('.read__cols .chip--miss', { scale: 0.5, autoAlpha: 0, duration: 0.45, ease: 'back.out(2.2)', stagger: 0.04 }, '<0.15')
    },
    { scope: root, dependencies: [live] },
  )

  useGSAP(
    () => {
      if (note && motionOK()) gsap.from('.note', { y: 16, autoAlpha: 0, duration: 0.6, ease: 'expo.out' })
    },
    { scope: root, dependencies: [note] },
  )

  function choose(id) {
    if (busy || id === pick) return
    setPick(id)
    setLive(null)
    setScore(null)
    setNote('')
  }

  async function run(e) {
    e.preventDefault()
    setBusy(true)
    setLive(null)
    setScore(null)
    setNote('')
    await wait(900)
    setBusy(false)
    setLive(job)
  }

  async function writeNote(next = tone) {
    setTone(next)
    setNoteBusy(true)
    await wait(700)
    setNote(job.notes[next])
    setNoteBusy(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(note)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  return (
    <div className="app" ref={root}>
      <header className="app__top">
        <TLink to="/" className="app__brand">
          <Logo />
          HireLens
        </TLink>
        <TLink to={own} className="btn btn--small">
          Use your own resume <Icon name="arrow" size={18} />
        </TLink>
      </header>

      <main className="app__main sample">
        <header className="title">
          <h1>
            Try a sample <Em>match.</Em>
          </h1>
          <p>
            {live && score != null
              ? `${verdict(live.final_score)}: ${live.matched_skills.length} asked skills on the resume, ${live.missing_skills.length} missing.`
              : 'A sample resume against a sample job. Pick a job and run the check. Nothing is saved.'}
          </p>
        </header>

        <div className="match">
          <form className="panel job" onSubmit={run}>
            <fieldset className="job__resumes">
              <legend className="label">Resume</legend>
              <div className="pick">
                <label>
                  <input type="radio" checked readOnly />
                  <span className="pick__name">sam-carter.pdf</span>
                  <span className="pick__date">Sample</span>
                </label>
              </div>
            </fieldset>

            <div className="field">
              <span>Job post</span>
              <div className="seg seg--wide" role="radiogroup" aria-label="Sample job">
                {SAMPLES.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={pick === s.id} onClick={() => choose(s.id)}>
                    {s.role}
                  </button>
                ))}
              </div>
              <p className="sample__post">{job.text}</p>
            </div>

            <button className="btn magnet" disabled={busy}>
              {busy ? (
                <>
                  <i className="spin" aria-hidden="true" /> Analysing
                </>
              ) : (
                <>
                  {live ? 'Analyse again' : 'Analyse match'} <Icon name="arrow" />
                </>
              )}
            </button>
          </form>

          <div className="match__stage">
            <Paper paperRef={paper} className={busy ? 'is-reading' : ''}>
              <TextDoc text={SAMPLE_RESUME} name="sam-carter.pdf" hits={live ? live.matched_skills : []} />
            </Paper>
          </div>

          <aside className="panel match__score" aria-live="polite" aria-busy={busy}>
            <ScoreRing value={score} size={176} caption={score == null ? (busy ? 'checking' : 'no result yet') : 'out of 100'} />
            <p className="match__verdict">{score == null ? (busy ? 'Analysing' : 'Ready to check') : verdict(score)}</p>
            {live && score != null ? (
              <ul className="match__meta">
                <li>
                  <b>{live.matched_skills.length}</b> on the resume
                </li>
                <li>
                  <b>{live.missing_skills.length}</b> missing
                </li>
              </ul>
            ) : (
              <p className="quiet">{busy ? 'Comparing the job with the resume.' : 'The score shows up here.'}</p>
            )}
          </aside>
        </div>

        {live && (
          <section className="read">
            <div className="panel">
              <div className="panel__head">
                <h2>The post, marked up</h2>
                <p className="legend">
                  <span className="chip chip--hit">on the resume</span>
                  <span className="chip chip--miss">missing</span>
                </p>
              </div>
              <p className="post is-open">
                <Marked text={live.text} hits={live.matched_skills} misses={live.missing_skills} />
              </p>
              <p className="summary">{live.summary}</p>
            </div>

            <div className="read__cols">
              <div className="panel">
                <h2>Missing</h2>
                <ul className="tags">
                  {live.missing_skills.map((s) => (
                    <li className="chip chip--miss" key={s}>
                      {s}
                    </li>
                  ))}
                </ul>
                <h2 className="mt">What to change</h2>
                <ul className="list">
                  {live.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="panel">
                <h2>Strengths for this job</h2>
                <ul className="list list--hit">
                  {live.strengths.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="panel">
              <div className="panel__head">
                <h2>Note to send</h2>
                <div className="seg" role="radiogroup" aria-label="Tone">
                  {TONES.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={tone === t} onClick={() => (note ? writeNote(t) : setTone(t))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {noteBusy ? (
                <Skel lines={5} className="skel--note" />
              ) : note ? (
                <textarea className="note" value={note} onChange={(e) => setNote(e.target.value)} rows={9} aria-label="Cover note, editable" />
              ) : (
                <p className="quiet">Written only from the resume. It will not claim a skill that is not there.</p>
              )}
              <div className="row">
                {!note && (
                  <button type="button" className="btn" onClick={() => writeNote()} disabled={noteBusy}>
                    {noteBusy ? (
                      <>
                        <i className="spin" aria-hidden="true" /> Writing
                      </>
                    ) : (
                      'Write the note'
                    )}
                  </button>
                )}
                {note && !noteBusy && (
                  <button type="button" className="btn btn--ghost" onClick={copy}>
                    {copied ? 'Copied' : 'Copy note'}
                  </button>
                )}
              </div>
            </div>

            <div className="panel sample__own">
              <div>
                <h2>Now try it with your own resume.</h2>
                <p className="quiet">Upload your PDF, paste any job description, and keep every application on one board.</p>
              </div>
              <TLink to={own} className="btn magnet">
                {status === 'in' ? 'Open Match' : 'Create a free account'} <Icon name="arrow" />
              </TLink>
            </div>
          </section>
        )}

        <p className="sample__note">This is a sample. The resume and jobs are made up and the results were prepared in advance.</p>
      </main>
    </div>
  )
}
