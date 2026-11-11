import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorText } from '../lib/api.js'
import { MOTION_OK, gsap, useGSAP } from '../lib/motion.js'
import { Marked } from '../components/bits.jsx'

const TONES = ['professional', 'friendly', 'confident']

const fileName = (path) => decodeURIComponent((path || '').split('/').pop() || 'resume.pdf')
const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function verdict(score) {
  if (score >= 75) return 'Strong fit'
  if (score >= 50) return 'Worth applying'
  return 'A stretch'
}

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

  const [tone, setTone] = useState('professional')
  const [note, setNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteError, setNoteError] = useState('')
  const [copied, setCopied] = useState(false)

  const [job, setJob] = useState({ company: '', role: '', link: '' })
  const [saveState, setSaveState] = useState('idle') // idle | busy | done
  const [saveError, setSaveError] = useState('')

  const readRef = useRef(null)
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

  // The score counts up and its two parts fill, once per new result.
  useGSAP(
    () => {
      if (!result || !window.matchMedia(MOTION_OK).matches) return
      const el = readRef.current.querySelector('.score__num')
      const count = { v: 0 }
      gsap.to(count, {
        v: result.final_score,
        duration: 1.1,
        ease: 'power3.out',
        snap: { v: 1 },
        onUpdate: () => {
          el.textContent = count.v
        },
      })
      gsap.from('.parts i', { scaleX: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 })
      gsap.from('.read__block', { autoAlpha: 0, y: 14, duration: 0.5, ease: 'power3.out', stagger: 0.06 })
    },
    { scope: readRef, dependencies: [result], revertOnUpdate: true },
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
    } catch (err) {
      setSaveError(errorText(err))
      setSaveState('idle')
    }
  }

  const ready = Boolean(resumeId) && jd.trim().length > 0
  const missing = result ? [...new Set([...result.missing_skills, ...result.ai_missing_skills.map((s) => s.toLowerCase())])] : []

  return (
    <>
      <header className="title">
        <div>
          <h1>Match</h1>
          <p>
            {result
              ? `${verdict(result.final_score)}: ${result.matched_skills.length} asked skills on your resume, ${result.missing_skills.length} missing.`
              : 'Pick a resume, paste a job post and read how well they fit.'}
          </p>
        </div>
      </header>

      <div className="match">
        <form className="panel job" onSubmit={run}>
          <fieldset className="job__resumes">
            <legend>Resume</legend>
            {resumes === null && <p className="quiet">Loading your resumes</p>}
            {loadError && (
              <p className="alert" role="alert">
                {loadError}
              </p>
            )}
            {resumes?.length === 0 && !loadError && (
              <p className="quiet">No resume yet. Upload a PDF to start.</p>
            )}
            {resumes?.map((r) => (
              <div className="pick" key={r.id}>
                <label>
                  <input
                    type="radio"
                    name="resume"
                    checked={resumeId === r.id}
                    onChange={() => setResumeId(r.id)}
                  />
                  <span className="pick__name">{fileName(r.file)}</span>
                  <span className="pick__date">{day(r.uploaded_at)}</span>
                </label>
                <button type="button" className="link" onClick={() => removeResume(r.id)} aria-label={`Remove ${fileName(r.file)}`}>
                  Remove
                </button>
              </div>
            ))}
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={upload} hidden />
            <button type="button" className="btn btn--soft" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Reading the PDF' : 'Upload a PDF'}
            </button>
            {uploadError && (
              <p className="alert" role="alert">
                {uploadError}
              </p>
            )}
          </fieldset>

          <label className="field">
            <span>Job post</span>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={12}
              placeholder="Paste the full job description here."
            />
          </label>

          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}

          <button className="btn job__go" disabled={!ready || busy}>
            {busy ? 'Reading both' : 'Read the match'}
          </button>
          {!resumeId && resumes !== null && <p className="quiet">Upload a resume first.</p>}
        </form>

        <section className="read" ref={readRef} aria-live="polite" aria-busy={busy}>
          <div className="panel score read__block">
            <p className="score__figure">
              <b className={`score__num${result ? '' : ' is-empty'}`}>{result ? result.final_score : '–'}</b>
              <span>{result ? verdict(result.final_score) : 'No match read yet'}</span>
            </p>
            <ul className="parts">
              <li>
                <span className="parts__l">Keyword match, 40%</span>
                <span className="bar"><i style={{ '--w': (result?.keyword_score ?? 0) / 100 }} /></span>
                <b>{result ? result.keyword_score : '–'}</b>
              </li>
              <li>
                <span className="parts__l">AI read, 60%</span>
                <span className="bar"><i style={{ '--w': (result?.ai_score ?? 0) / 100 }} /></span>
                <b>{result ? result.ai_score : '–'}</b>
              </li>
            </ul>
          </div>

          {!result && (
            <div className="panel empty read__block">
              <h2>What you will get</h2>
              <p>
                The job post marked up in two colours, the skills you are missing, what to change on
                your resume, and a note you can send.
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="panel read__block">
                <div className="panel__head">
                  <h2>The post, marked up</h2>
                  <p className="legend">
                    <span className="legend__hit">On your resume</span>
                    <span className="legend__miss">Missing</span>
                  </p>
                </div>
                <p className="post">
                  <Marked text={result.jd} hits={result.matched_skills} misses={result.missing_skills} />
                </p>
                <p className="summary">{result.summary}</p>
              </div>

              <div className="cols read__block">
                <div className="panel">
                  <h2>Missing</h2>
                  {missing.length ? (
                    <ul className="tags">
                      {missing.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="quiet">Nothing the post asks for is missing.</p>
                  )}
                  <h2 className="gap">What to change</h2>
                  <ul className="list">
                    {result.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="panel">
                  <h2>Your strengths for this job</h2>
                  <ul className="list">
                    {result.strengths.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="panel read__block">
                <div className="panel__head">
                  <h2>Note to send</h2>
                  <div className="seg" role="radiogroup" aria-label="Tone">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={tone === t}
                        onClick={() => setTone(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {note ? (
                  <p className="note">{note}</p>
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
                    {noteBusy ? 'Writing' : note ? 'Write it again' : 'Write the note'}
                  </button>
                  {note && (
                    <button type="button" className="btn btn--soft" onClick={copy}>
                      {copied ? 'Copied' : 'Copy note'}
                    </button>
                  )}
                </div>
              </div>

              <form className="panel read__block" onSubmit={save}>
                <h2>Save to the tracker</h2>
                {saveState === 'done' ? (
                  <p className="done">
                    Saved with its score{note ? ' and note' : ''}. <Link to="/app/tracker">Open the tracker</Link>
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
                        <input
                          type="url"
                          value={job.link}
                          onChange={(e) => setJob({ ...job, link: e.target.value })}
                          placeholder="https://"
                        />
                      </label>
                    </div>
                    {saveError && (
                      <p className="alert" role="alert">
                        {saveError}
                      </p>
                    )}
                    <button className="btn btn--soft" disabled={saveState === 'busy'}>
                      {saveState === 'busy' ? 'Saving' : 'Save application'}
                    </button>
                  </>
                )}
              </form>
            </>
          )}
        </section>
      </div>
    </>
  )
}
