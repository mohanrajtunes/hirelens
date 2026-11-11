import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api, { errorText } from '../../lib/api.js'
import { Draggable, finePointer, Flip, gsap, motionOK, useGSAP } from '../../lib/motion.js'
import { confetti } from '../../lib/fun.js'
import { countByStatus, day, STATUSES, today } from '../../lib/jobs.js'
import { Em, Icon, Empty, Skel } from '../../components/bits.jsx'
import { tone } from '../../components/ScoreRing.jsx'

const BLANK = { company: '', role: '', link: '', status: 'saved', applied_date: '', match_score: '', notes: '' }

function finding(apps, counts) {
  if (!apps.length) return 'Nothing saved yet. Add the first job you are looking at.'
  const parts = []
  if (counts.offer) parts.push(`${counts.offer} offer${counts.offer > 1 ? 's' : ''}`)
  if (counts.interview) parts.push(`${counts.interview} at interview`)
  if (counts.applied) parts.push(`${counts.applied} waiting on a reply`)
  if (counts.saved) parts.push(`${counts.saved} saved and not sent`)
  if (!parts.length) parts.push(`${counts.rejected} closed`)
  return `${apps.length} application${apps.length > 1 ? 's' : ''}: ${parts.join(', ')}.`
}

export default function Tracker() {
  const location = useLocation()
  const [apps, setApps] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null) // null closed, otherwise the row being added or edited
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const dialog = useRef(null)
  const board = useRef(null)
  const flip = useRef(null) // card positions captured just before a move
  const entered = useRef(false)

  useEffect(() => {
    let alive = true
    api
      .get('/jobs/')
      .then(({ data }) => alive && setApps(data))
      .catch((err) => alive && (setApps([]), setError(errorText(err))))
    return () => {
      alive = false
    }
  }, [])

  // "Add an application" from another page lands here with a flag.
  useEffect(() => {
    if (location.state?.add) {
      setFormError('')
      setForm({ ...BLANK })
    }
  }, [location.state?.add])

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (form && !el.open) {
      el.showModal()
      if (motionOK()) gsap.fromTo(el, { y: 50, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.5)' })
    }
    if (!form && el.open) el.close()
  }, [form])

  const counts = useMemo(() => countByStatus(apps || []), [apps])

  async function setStatus(app, status) {
    if (app.status === status) return
    const patch = { status }
    if (status !== 'saved' && !app.applied_date) patch.applied_date = today()
    const before = apps
    if (motionOK() && board.current) flip.current = Flip.getState(board.current.querySelectorAll('.card'))
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, ...patch } : a)))
    setError('')
    if (status === 'offer') confetti(window.innerWidth / 2, window.innerHeight / 2, 140)
    try {
      await api.patch(`/jobs/${app.id}/`, patch)
    } catch (err) {
      setApps(before)
      setError(errorText(err))
    }
  }

  async function remove(app) {
    const before = apps
    if (motionOK() && board.current) flip.current = Flip.getState(board.current.querySelectorAll('.card'))
    setApps((list) => list.filter((a) => a.id !== app.id))
    setConfirmId(null)
    try {
      await api.delete(`/jobs/${app.id}/`)
    } catch (err) {
      setApps(before)
      setError(errorText(err))
    }
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const body = {
      company: form.company.trim(),
      role: form.role.trim(),
      link: form.link.trim(),
      status: form.status,
      notes: form.notes,
      applied_date: form.applied_date || null,
      match_score: form.match_score === '' || form.match_score == null ? null : Number(form.match_score),
    }
    try {
      if (form.id) {
        const { data } = await api.patch(`/jobs/${form.id}/`, body)
        setApps((list) => list.map((a) => (a.id === data.id ? data : a)))
      } else {
        const { data } = await api.post('/jobs/', body)
        setApps((list) => [data, ...list])
      }
      setForm(null)
    } catch (err) {
      setFormError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const edit = (app) => {
    setFormError('')
    setForm({ ...BLANK, ...app, applied_date: app.applied_date || '', match_score: app.match_score ?? '' })
  }

  // After every change to the list: slide cards to their new places, then
  // make each card draggable again (React gives a moved card a new element).
  useGSAP(
    () => {
      if (!apps) return
      const ok = motionOK()
      // start every pass from clean positions, so nothing stays half-moved
      gsap.set('.card', { clearProps: 'transform,zIndex' })
      if (flip.current) {
        Flip.from(flip.current, { targets: board.current.querySelectorAll('.card'), duration: 0.55, ease: 'back.out(1.3)' })
        flip.current = null
      } else if (ok && !entered.current) {
        gsap.from('.col', { y: 50, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 })
        gsap.from('.card', { scale: 0.7, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.04, delay: 0.25 })
      }
      entered.current = true
      if (!finePointer()) return // phones use the "Move to" menu on each card
      const cols = gsap.utils.toArray('.col')
      const drags = Draggable.create('.card', {
        zIndexBoost: true,
        onPress() {
          gsap.to(this.target, { scale: 1.05, rotation: -2.5, duration: 0.2 })
        },
        onDrag() {
          cols.forEach((c) => c.classList.toggle('is-over', this.hitTest(c, '50%')))
        },
        onRelease() {
          gsap.to(this.target, { scale: 1, rotation: 0, duration: 0.3 })
        },
        onDragEnd() {
          const over = cols.find((c) => this.hitTest(c, '50%'))
          cols.forEach((c) => c.classList.remove('is-over'))
          const app = apps.find((a) => String(a.id) === this.target.dataset.id)
          if (over && app && over.dataset.status !== app.status) setStatus(app, over.dataset.status)
          else gsap.to(this.target, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)' })
        },
      })
      return () => drags.forEach((d) => d.kill())
    },
    { scope: board, dependencies: [apps], revertOnUpdate: true },
  )

  const field = (key) => ({
    value: form?.[key] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <>
      <header className="title title--row">
        <div>
          <h1>
            Your <Em>applications.</Em>
          </h1>
          <p>{apps === null ? 'Loading your applications' : finding(apps, counts)}</p>
        </div>
        <button type="button" className="btn magnet" onClick={() => (setFormError(''), setForm({ ...BLANK }))}>
          <Icon name="plus" size={18} /> Add application
        </button>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {apps && apps.length === 0 && (
        <Empty icon="board" title="No applications yet" text="Match a job and save it, or add one by hand. Then drag each card across the board as things happen." to="/app/match" cta="Match a job">
          <button type="button" className="btn btn--ghost" onClick={() => (setFormError(''), setForm({ ...BLANK }))}>
            <Icon name="plus" size={18} /> Add by hand
          </button>
        </Empty>
      )}

      <div className="board" ref={board}>
        {STATUSES.map(([key, label]) => (
          <section className={`col col--${key}`} key={key} data-status={key} aria-label={label}>
            <h2>
              <i className={`st--${key}`} aria-hidden="true" />
              {label} <b>{apps ? counts[key] : ''}</b>
            </h2>
            <ul>
              {(apps || [])
                .filter((a) => a.status === key)
                .map((app) => (
                  <li className="card" key={app.id} data-id={app.id} data-flip-id={`app-${app.id}`}>
                    <p className="card__top">
                      <b>{app.company}</b>
                      {app.match_score != null && <span className={`score score--${tone(app.match_score)}`}>{app.match_score}</span>}
                    </p>
                    <p className="card__role">{app.role}</p>
                    {app.applied_date && <p className="card__date">Applied {day(app.applied_date)}</p>}
                    <div className="card__acts">
                      {confirmId === app.id ? (
                        <>
                          <span>Delete it?</span>
                          <button type="button" className="link link--danger" onClick={() => remove(app)}>
                            Yes
                          </button>
                          <button type="button" className="link" onClick={() => setConfirmId(null)}>
                            Keep
                          </button>
                        </>
                      ) : (
                        <>
                          <select value={app.status} onChange={(e) => setStatus(app, e.target.value)} aria-label={`Move ${app.company} to`}>
                            {STATUSES.map(([k, l]) => (
                              <option key={k} value={k}>
                                {l}
                              </option>
                            ))}
                          </select>
                          {app.link && (
                            <a className="link" href={app.link} target="_blank" rel="noreferrer">
                              Post
                            </a>
                          )}
                          <button type="button" className="link" onClick={() => edit(app)}>
                            Edit
                          </button>
                          <button type="button" className="link link--danger" onClick={() => setConfirmId(app.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
            {!apps && <Skel lines={3} className="skel--card" />}
            {apps && counts[key] === 0 && <p className="col__none">Drop a card here</p>}
          </section>
        ))}
      </div>

      <dialog ref={dialog} className="sheet glass" onClose={() => setForm(null)} aria-labelledby="sheet-h">
        {form && (
          <form onSubmit={submit}>
            <h2 id="sheet-h">{form.id ? 'Edit application' : 'Add application'}</h2>
            <div className="grid2">
              <label className="field">
                <span>Company</span>
                <input {...field('company')} required autoFocus />
              </label>
              <label className="field">
                <span>Role</span>
                <input {...field('role')} required />
              </label>
            </div>
            <label className="field">
              <span>Link to the post</span>
              <input type="url" placeholder="https://" {...field('link')} />
            </label>
            <div className="grid3">
              <label className="field">
                <span>Status</span>
                <select {...field('status')}>
                  {STATUSES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Applied on</span>
                <input type="date" {...field('applied_date')} />
              </label>
              <label className="field">
                <span>Match score</span>
                <input type="number" min="0" max="100" inputMode="numeric" {...field('match_score')} />
              </label>
            </div>
            <label className="field">
              <span>Notes</span>
              <textarea rows={3} {...field('notes')} />
            </label>
            {form.cover_note && (
              <details className="saved-note">
                <summary>Saved note</summary>
                <p>{form.cover_note}</p>
              </details>
            )}
            {formError && (
              <p className="alert" role="alert">
                {formError}
              </p>
            )}
            <div className="row row--end">
              <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="btn" disabled={saving}>
                {saving ? 'Saving' : form.id ? 'Save changes' : 'Add application'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}
