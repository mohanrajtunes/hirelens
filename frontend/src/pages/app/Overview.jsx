import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorText } from '../../lib/api.js'
import { useAuth } from '../../lib/auth.jsx'
import { gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { average, countByStatus, day, fileName, LABEL, STATUSES, streak } from '../../lib/jobs.js'
import { Em, Icon, Skel } from '../../components/bits.jsx'
import ScoreRing from '../../components/ScoreRing.jsx'

function nudge(apps, counts, resumes) {
  if (!resumes.length) return ['Upload your resume first.', 'It takes one PDF. Then every job post can be read against it.', 'Upload a resume']
  if (!apps.length) return ['Run your first match.', 'Paste a job post you are looking at and see where you stand.', 'Match a job']
  if (counts.saved) return [`${counts.saved} saved and not sent.`, 'Review a saved job and prepare its cover note.', 'Match another job']
  return ['Add another application.', 'Match a new job description against your resume.', 'Match a job']
}

export default function Overview() {
  const { user } = useAuth()
  const root = useRef(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([api.get('/jobs/'), api.get('/resumes/')])
      .then(([jobs, resumes]) => alive && setData({ apps: jobs.data, resumes: resumes.data }))
      .catch((err) => alive && (setData({ apps: [], resumes: [] }), setError(errorText(err))))
    return () => {
      alive = false
    }
  }, [])

  const apps = data?.apps || []
  const resumes = data?.resumes || []
  const counts = countByStatus(apps)
  const avg = average(apps)
  const run = streak(apps)
  const answered = counts.interview + counts.offer + counts.rejected
  const sent = answered + counts.applied
  const top = Math.max(1, ...Object.values(counts))
  const [head, text, cta] = nudge(apps, counts, resumes)

  useGSAP(
    () => {
      if (!data || !motionOK()) return
      gsap.from('.panel', { y: 36, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 })
      gsap.utils.toArray('.tile__num[data-n]').forEach((el) => {
        const end = Number(el.dataset.n)
        const count = { v: 0 }
        gsap.to(count, { v: end, duration: 1.2, ease: 'power3.out', snap: { v: 1 }, delay: 0.25, onUpdate: () => (el.textContent = count.v) })
      })
      gsap.from('.funnel i', { scaleX: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.35 })
    },
    { scope: root, dependencies: [Boolean(data)] },
  )

  return (
    <div ref={root}>
      <header className="title">
        <h1>
          Welcome, <Em>{user?.username}.</Em>
        </h1>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {!data && (
        <div className="over" aria-busy="true">
          {['over__next', 'tile', 'tile', 'tile', 'over__funnel', 'over__recent'].map((c, i) => (
            <section className={`panel ${c}`} key={i}>
              <Skel lines={c === 'tile' ? 2 : 4} />
            </section>
          ))}
        </div>
      )}

      {data && !apps.length && (
        <div className="over">
          <section className="panel over__next">
            <p className="label">Next move</p>
            <h2>{head}</h2>
            <p className="quiet">{text}</p>
            <Link to="/app/match" className="btn magnet">
              {cta} <Icon name="arrow" />
            </Link>
          </section>
          <section className="panel over__start">
            <p className="label">Getting started</p>
            <ol className="steps">
              {[
                ['Upload your resume', 'One PDF, read once.', resumes.length > 0],
                ['Match a job', 'Paste a job description and see your score.', false],
                ['Save it to the tracker', 'Your stats and skills gap build from saved jobs.', false],
              ].map(([t, d, ok], i) => (
                <li key={t} className={ok ? 'is-done' : ''}>
                  <span aria-hidden="true">{ok ? <Icon name="check" size={16} /> : i + 1}</span>
                  <b>{t}</b>
                  <em>{ok ? 'Done' : d}</em>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {data && apps.length > 0 && (
        <div className="over">
          <section className="panel over__next">
            <p className="label">Next move</p>
            <h2>{head}</h2>
            <p className="quiet">{text}</p>
            <Link to="/app/match" className="btn magnet">
              {cta} <Icon name="arrow" />
            </Link>
          </section>

          <section className="panel tile">
            <p className="label">Applications</p>
            <b className="tile__num" data-n={apps.length}>
              {apps.length}
            </b>
            <p className="quiet">{sent ? `${sent} sent, ${answered} answered` : 'none sent yet'}</p>
          </section>

          <section className="panel tile tile--ring">
            <p className="label">Average match</p>
            <ScoreRing value={avg} size={120} delay={0.3} />
          </section>

          <section className="panel tile">
            <p className="label">Streak</p>
            <b className="tile__num" data-n={run}>
              {run}
            </b>
            <p className="quiet">{run ? `day${run > 1 ? 's' : ''} in a row with a new job` : 'add a job today to start one'}</p>
          </section>

          <section className="panel over__funnel">
            <p className="label">Where they stand</p>
            <ul className="funnel">
              {STATUSES.map(([key, label]) => (
                <li key={key} className={`st--${key}`}>
                  <span>{label}</span>
                  <i style={{ '--w': counts[key] / top }} />
                  <b>{counts[key]}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel over__recent">
            <p className="label">Latest</p>
            {apps.length ? (
              <ul className="recent">
                {apps.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <span>
                      <b>{a.company}</b>
                      {a.role}
                    </span>
                    <span className={`pill st--${a.status}`}>{LABEL[a.status]}</span>
                    <span className="recent__score">{a.match_score ?? '–'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">No applications saved yet.</p>
            )}
            <Link className="link" to="/app/tracker">
              Open the tracker
            </Link>
          </section>

          <section className="panel over__resume">
            <p className="label">Resume on file</p>
            {resumes.length ? (
              <p className="over__file">
                <span className="over__sheet" aria-hidden="true" />
                <span>
                  <b>{fileName(resumes[0].file)}</b>
                  uploaded {day(resumes[0].uploaded_at)}
                </span>
              </p>
            ) : (
              <p className="quiet">None yet. Upload one on the Match page.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
