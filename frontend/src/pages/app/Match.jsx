import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorText } from '../../lib/api.js'
import { gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { confetti } from '../../lib/fun.js'
import { day, fileName, verdict } from '../../lib/jobs.js'
import { Em, Icon, Marked, Skel } from '../../components/bits.jsx'
import Paper, { scanTl, showPaper, TextDoc, unfoldTl } from '../../components/Paper.jsx'
import ScoreRing from '../../components/ScoreRing.jsx'

const TONES = ['professional', 'friendly', 'confident']

export default function Match() {
  const [resumes, setResumes] = useState(null) // null while loading
  const [resumeId, setResumeId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [jd, setJd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore] = useState(null) // shown once the scan has finished

  const [tone, setTone] = useState('professional')
  const [note, setNote] = useState('')
  const [noteTone, setNoteTone] = useState('') // the tone the current note was written in
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteError, setNoteError] = useState('')
  const [copied, setCopied] = useState(false)

  const [job, setJob] = useState({ company: '', role: '', link: '' })
  const [saveState, setSaveState] = useState('idle') // idle | busy | done
  const [saveError, setSaveError] = useState('')

  const root = useRef(null)
  const paper = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    let alive = true
    api
      .get('/resumes/')
      .then(({ data }) => {
        if (!alive) return
        setResumes(data)
        setResumeId(data[0]?.id ?? null)
      })
      .catch((err) => alive && (setResumes([]), setLoadError(errorText(err))))
    return () => {
      alive = false
    }
  }, [])

  const resume = resumes?.find((r) => r.id === resumeId) || null
  const live = result && result.resumeId === resumeId ? result : null

  // A resume is picked: its letter flies in and opens.
  useGSAP(
    () => {
      if (!resume) return
      if (!motionOK()) showPaper(paper.current)
      else unfoldTl(paper.current)
      gsap.from('.match .panel', { y: 36, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 })
    },
    { scope: root, dependencies: [resume?.id] },
  )

  // A result arrives: scan the sheet, then show the score and the rest.
  useGSAP(
    () => {
      if (!live || !paper.current) return
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
          if (live.final_score >= 75) {
            const r = root.current.querySelector('.ring').getBoundingClientRect()
            confetti(r.left + r.width / 2, r.top + r.height / 2, 120)
          }
        }, null, '-=0.5')
        .to('.read > *', { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, '<0.1')
    },
    { scope: root, dependencies: [live] },
  )

  async function upload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post('/resumes/', body)
      setResumes((list) => [data, ...(list || [])])
      setResumeId(data.id)
    } catch (err) {
      setUploadError(errorText(err))
    } finally {
      setUploading(false)
    }
  }

  async function removeResume(id) {
    try {
      await api.delete(`/resumes/${id}/`)
      setResumes((list) => {
        const rest = list.filter((r) => r.id !== id)
        if (resumeId === id) setResumeId(rest[0]?.id ?? null)
        return rest
      })
    } catch (err) {
      setUploadError(errorText(err))
    }
  }

  async function run(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setScore(null)
    try {
      const text = jd.trim()
      const { data } = await api.post('/ai/match/', { resume_id: resumeId, job_description: text })
      setResult({ ...data, jd: text, resumeId })
      setNote('')
      setNoteError('')
      setSaveState('idle')
      setSaveError('')
    } catch (err) {
      setError(errorText(err))
      setScore(live?.final_score ?? null)
    } finally {
      setBusy(false)
    }
  }

  async function writeNote() {
    setNoteBusy(true)
    setNoteError('')
    try {
      const { data } = await api.post('/ai/cover-note/', {
        resume_id: result.resumeId,
        job_description: result.jd,
        tone,
      })
      setNote(data.cover_note)
      setNoteTone(tone)
    } catch (err) {
      setNoteError(errorText(err))
    } finally {
      setNoteBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(note)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setNoteError('Copy was blocked by the browser. Select the note and copy it by hand.')
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaveState('busy')
    setSaveError('')
    try {
      await api.post('/jobs/', {
        company: job.company.trim(),
        role: job.role.trim(),
        link: job.link.trim(),
        job_description: result.jd,
        status: 'saved',
        match_score: result.final_score,
        cover_note: note,
      })
      setSaveState('done')
      confetti(window.innerWidth / 2, window.innerHeight * 0.7, 50)
    } catch (err) {
      setSaveError(errorText(err))
      setSaveState('idle')
    }
  }

  const ready = Boolean(resumeId) && jd.trim().length > 0
  const missing = live ? [...new Set([...live.missing_skills, ...live.ai_missing_skills.map((s) => s.toLowerCase())])] : []

  return (
    <div ref={root}>
      <header className="title">
        <h1>
          Match a <Em>job.</Em>
        </h1>
        <p>
          {live
            ? `${verdict(live.final_score)}: ${live.matched_skills.length} asked skills on your resume, ${live.missing_skills.length} missing.`
            : 'Select a resume and paste a job description to see your match.'}
        </p>
      </header>

      <div className="match">
        <form className="panel job" onSubmit={run}>
          <fieldset className="job__resumes">
            <legend className="label">Resume</legend>
            {resumes === null && <Skel lines={1} className="skel--row" />}
            {loadError && (
              <p className="alert" role="alert">
                {loadError}
              </p>
            )}
            {resumes?.map((r) => (
              <div className="pick" key={r.id}>
                <label>
                  <input type="radio" name="resume" checked={resumeId === r.id} onChange={() => setResumeId(r.id)} />
                  <span className="pick__name">{fileName(r.file)}</span>
                  <span className="pick__date">{day(r.uploaded_at)}</span>
                </label>
                <button type="button" className="link link--danger" onClick={() => removeResume(r.id)} aria-label={`Remove ${fileName(r.file)}`}>
                  Remove
                </button>
              </div>
            ))}
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={upload} hidden />
            <button type="button" className="btn btn--ghost btn--small" onClick={() => fileRef.current.click()} disabled={uploading}>
              <Icon name="upload" size={18} /> {uploading ? 'Reading the PDF' : 'Upload a PDF'}
            </button>
            {uploadError && (
              <p className="alert" role="alert">
                {uploadError}
              </p>
            )}
          </fieldset>

          <label className="field">
            <span>Job post</span>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={9} placeholder="Paste the full job description here." />
          </label>

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          <button className="btn magnet" disabled={!ready || busy}>
            {busy ? (
              <>
                <i className="spin" aria-hidden="true" /> Analysing
              </>
            ) : (
              <>
                Analyse match <Icon name="arrow" />
              </>
            )}
          </button>
          {!resumeId && resumes !== null && <p className="quiet">Upload a resume first.</p>}
        </form>

        <div className="match__stage">
          {resume ? (
            <Paper key={resume.id} paperRef={paper} className={busy ? 'is-reading' : ''}>
              <TextDoc text={resume.text} name={fileName(resume.file)} hits={live ? live.matched_skills : []} />
            </Paper>
          ) : (
            <div className="match__empty">
              <span aria-hidden="true">
                <Icon name="doc" size={26} />
              </span>
              <b>{resumes === null ? 'Loading your resume' : 'No resume yet'}</b>
              {resumes !== null && (
                <>
                  <p>Upload one PDF. It is read once and reused for every job you check.</p>
                  <button type="button" className="btn btn--small" onClick={() => fileRef.current.click()} disabled={uploading}>
                    <Icon name="upload" size={18} /> {uploading ? 'Reading the PDF' : 'Upload a PDF'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="panel match__score" aria-live="polite" aria-busy={busy}>
          <ScoreRing value={score} size={176} caption={score == null ? (busy ? 'checking' : 'no result yet') : 'out of 100'} />
          <p className="match__verdict">{score == null ? (busy ? 'Analysing' : 'Waiting for a job post') : verdict(score)}</p>
          {live && score != null ? (
            <ul className="match__meta">
              <li>
                <b>{live.matched_skills.length}</b> on your resume
              </li>
              <li>
                <b>{missing.length}</b> missing
              </li>
            </ul>
          ) : (
            <p className="quiet">{busy ? 'Comparing the job with your resume.' : 'Your score shows up here.'}</p>
          )}
        </aside>
      </div>

      {live && (
        <section className="read">
          <div className="panel">
            <div className="panel__head">
              <h2>The post, marked up</h2>
              <p className="legend">
                <span className="chip chip--hit">on your resume</span>
                <span className="chip chip--miss">missing</span>
              </p>
            </div>
            <p className="post">
              <Marked text={live.jd} hits={live.matched_skills} misses={live.missing_skills} />
            </p>
            <p className="summary">{live.summary}</p>
          </div>

          <div className="read__cols">
            <div className="panel">
              <h2>Missing</h2>
              {missing.length ? (
                <ul className="tags">
                  {missing.map((s) => (
                    <li className="chip chip--miss" key={s}>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="quiet">No missing skills found.</p>
              )}
              <h2 className="mt">What to change</h2>
              <ul className="list">
                {live.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h2>Your strengths for this job</h2>
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
                  <button key={t} type="button" role="radio" aria-checked={tone === t} onClick={() => setTone(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {noteBusy ? (
              <Skel lines={5} className="skel--note" />
            ) : note ? (
              <>
                <textarea className="note" value={note} onChange={(e) => setNote(e.target.value)} rows={Math.min(16, Math.max(6, Math.ceil(note.length / 95) + 2))} aria-label="Cover note, editable" />
                <p className="note__meta">
                  <span>{note.trim().split(/\s+/).filter(Boolean).length} words. You can edit the text before you copy it.</span>
                  {noteTone && noteTone !== tone && <b>Tone changed. Rewrite to apply it.</b>}
                </p>
              </>
            ) : (
              <p className="quiet">Written only from your resume. It will not claim a skill you do not have.</p>
            )}
            {noteError && (
              <p className="alert" role="alert">
                {noteError}
              </p>
            )}
            <div className="row">
              <button type="button" className="btn" onClick={writeNote} disabled={noteBusy}>
                {noteBusy ? (
                  <>
                    <i className="spin" aria-hidden="true" /> Writing
                  </>
                ) : note ? (
                  `Rewrite, ${tone}`
                ) : (
                  'Write the note'
                )}
              </button>
              {note && !noteBusy && (
                <button type="button" className="btn btn--ghost" onClick={copy}>
                  {copied ? 'Copied' : 'Copy note'}
                </button>
              )}
            </div>
          </div>

          <form className="panel" onSubmit={save}>
            <h2>Save to the tracker</h2>
            {saveState === 'done' ? (
              <p className="done">
                Saved with its score{note ? ' and note' : ''}.{' '}
                <Link className="link" to="/app/tracker">
                  Open the tracker
                </Link>
              </p>
            ) : (
              <>
                <div className="grid3">
                  <label className="field">
                    <span>Company</span>
                    <input value={job.company} onChange={(e) => setJob({ ...job, company: e.target.value })} required />
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <input value={job.role} onChange={(e) => setJob({ ...job, role: e.target.value })} required />
                  </label>
                  <label className="field">
                    <span>Link to the post</span>
                    <input type="url" value={job.link} onChange={(e) => setJob({ ...job, link: e.target.value })} placeholder="https://" />
                  </label>
                </div>
                {saveError && (
                  <p className="alert" role="alert">
                    {saveError}
                  </p>
                )}
                <button className="btn btn--ghost" disabled={saveState === 'busy'}>
                  {saveState === 'busy' ? (
                    <>
                      <i className="spin" aria-hidden="true" /> Saving
                    </>
                  ) : (
                    'Save application'
                  )}
                </button>
              </>
            )}
          </form>
        </section>
      )}
    </div>
  )
}
