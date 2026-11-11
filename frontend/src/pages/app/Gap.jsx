import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorText } from '../../lib/api.js'
import { gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { fileName } from '../../lib/jobs.js'
import { extractSkills } from '../../lib/skills.js'
import { Em, Empty, Icon, Skel } from '../../components/bits.jsx'

// Across every saved job post: which skills keep coming up that the resume lacks?
function tally(apps, resume) {
  const have = new Set(extractSkills(resume?.text || ''))
  const posts = apps.filter((a) => (a.job_description || '').trim())
  const miss = new Map()
  const hit = new Map()
  const gaps = posts.map((a) => {
    const asked = extractSkills(a.job_description)
    const lacking = asked.filter((s) => !have.has(s))
    asked.forEach((s) => {
      const map = have.has(s) ? hit : miss
      map.set(s, (map.get(s) || 0) + 1)
    })
    return lacking
  })
  const rank = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const missing = rank(miss)
  const first = missing[0]?.[0]
  // How many posts would have no gap at all if the top skill were learned.
  const clearNow = gaps.filter((g) => g.length === 0).length
  const clearThen = first ? gaps.filter((g) => g.every((s) => s === first)).length : clearNow
  return { posts: posts.length, missing, covered: rank(hit), first, clearNow, clearThen }
}

export default function Gap() {
  const root = useRef(null)
  const [data, setData] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([api.get('/jobs/'), api.get('/resumes/')])
      .then(([jobs, resumes]) => {
        if (!alive) return
        setData({ apps: jobs.data, resumes: resumes.data })
        setResumeId(resumes.data[0]?.id ?? null)
      })
      .catch((err) => alive && (setData({ apps: [], resumes: [] }), setError(errorText(err))))
    return () => {
      alive = false
    }
  }, [])

  const resume = data?.resumes.find((r) => r.id === resumeId) || null
  const t = useMemo(() => (data && resume ? tally(data.apps, resume) : null), [data, resume])
  const most = t?.missing[0]?.[1] || 1

  useGSAP(
    () => {
      if (!t || !motionOK()) return
      gsap.from('.panel', { y: 36, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 })
      gsap.from('.gapbar i', { scaleX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.3 })
      gsap.from('.gap__covered .chip', { scale: 0, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.04, delay: 0.5 })
    },
    { scope: root, dependencies: [t] },
  )

  const none = data && (!resume || !t.posts)

  return (
    <div ref={root}>
      <header className="title">
        <h1>
          {t?.first ? (
            <>
              Most requested gap: <Em>{t.first}.</Em>
            </>
          ) : (
            <>
              Your skills <Em>gap.</Em>
            </>
          )}
        </h1>
        <p>
          {t?.posts
            ? `Read from ${t.posts} saved job post${t.posts > 1 ? 's' : ''} against ${fileName(resume.file)}.`
            : 'Which skills keep showing up in your saved jobs that your resume does not have.'}
        </p>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {!data && (
        <div className="gap" aria-busy="true">
          <section className="panel gap__list">
            <Skel lines={5} />
          </section>
          <section className="panel">
            <Skel lines={3} />
          </section>
        </div>
      )}

      {none && (
        <Empty
          icon="gap"
          title={resume ? 'No saved jobs to compare yet' : 'No resume yet'}
          text={
            resume
              ? 'Match a job and save it to the tracker. Once a few are saved, this page ranks the skills they ask for that your resume does not have.'
              : 'Upload a resume on the Match page first.'
          }
          to="/app/match"
          cta={resume ? 'Match a job' : 'Upload a resume'}
        />
      )}

      {t && t.posts > 0 && (
        <div className="gap">
          <section className="panel gap__list">
            <div className="panel__head">
              <h2>Learn these next</h2>
              {data.resumes.length > 1 && (
                <select value={resumeId} onChange={(e) => setResumeId(Number(e.target.value))} aria-label="Resume to compare">
                  {data.resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {fileName(r.file)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {t.missing.length ? (
              <ol>
                {t.missing.slice(0, 10).map(([skill, n], i) => (
                  <li className="gapbar" key={skill}>
                    <span className="gapbar__rank">{String(i + 1).padStart(2, '0')}</span>
                    <b>{skill}</b>
                    <span className="gapbar__n">
                      in {n} of {t.posts}
                    </span>
                    <i style={{ '--w': n / most }} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="quiet">Every skill these job descriptions ask for is on your resume.</p>
            )}
          </section>

          <section className="panel gap__tip">
            <p className="label">The quickest win</p>
            {t.first ? (
              <>
                <h2>
                  Learn <Em>{t.first}</Em>
                </h2>
                <p className="quiet">
                  Right now {t.clearNow} of {t.posts} saved posts have no gap. Add {t.first} and that becomes{' '}
                  <b>{t.clearThen}</b>.
                </p>
              </>
            ) : (
              <h2>You are covered.</h2>
            )}
            <Link to="/app/match" className="btn btn--ghost btn--small">
              Read another post <Icon name="arrow" size={18} />
            </Link>
          </section>

          <section className="panel gap__covered">
            <p className="label">Already on your resume</p>
            {t.covered.length ? (
              <ul className="tags">
                {t.covered.map(([skill, n]) => (
                  <li className="chip chip--hit" key={skill}>
                    {skill} <b>{n}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">None of the asked skills were found on this resume.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
