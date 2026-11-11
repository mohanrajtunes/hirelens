import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorText } from '../lib/api.js'

const STATUSES = [
  ['saved', 'Saved'],
  ['applied', 'Applied'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['rejected', 'Rejected'],
]
const LABEL = Object.fromEntries(STATUSES)
const BLANK = { company: '', role: '', link: '', status: 'saved', applied_date: '', match_score: '', notes: '' }

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
const day = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null

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
  const [apps, setApps] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null) // null closed, otherwise the row being added or edited
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const dialog = useRef(null)

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

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (form && !el.open) el.showModal()
    if (!form && el.open) el.close()
  }, [form])

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map(([key]) => [key, 0]))
    ;(apps || []).forEach((a) => (c[a.status] += 1))
    return c
  }, [apps])

  const scored = (apps || []).filter((a) => a.match_score != null)
  const average = scored.length ? Math.round(scored.reduce((sum, a) => sum + a.match_score, 0) / scored.length) : null
  const shown = (apps || []).filter((a) => filter === 'all' || a.status === filter)

  async function setStatus(app, status) {
    const patch = { status }
    if (status !== 'saved' && !app.applied_date) patch.applied_date = today()
    const before = apps
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, ...patch } : a)))
    setError('')
    try {
      await api.patch(`/jobs/${app.id}/`, patch)
    } catch (err) {
      setApps(before)
      setError(errorText(err))
    }
  }

  async function remove(app) {
    const before = apps
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

  const field = (key) => ({
    value: form?.[key] ?? '',
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <>
      <header className="title">
        <div>
          <h1>Tracker</h1>
          <p>{apps === null ? 'Loading your applications' : finding(apps, counts)}</p>
        </div>
        <button type="button" className="btn" onClick={() => (setFormError(''), setForm({ ...BLANK }))}>
          Add application
        </button>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <section className="panel pipe" aria-label="Pipeline">
        <div className="pipe__figures">
          <p>
            <b>{apps ? apps.length : '–'}</b>
            <span>Applications</span>
          </p>
          <p>
            <b>{average ?? '–'}</b>
            <span>Average match</span>
          </p>
        </div>
        <div className="pipe__chart">
          <div className="pipe__bar" aria-hidden="true">
            {apps?.length ? (
              STATUSES.filter(([key]) => counts[key]).map(([key]) => (
                <i key={key} className={`st st--${key}`} style={{ flexGrow: counts[key] }} />
              ))
            ) : (
              <i className="st st--none" style={{ flexGrow: 1 }} />
            )}
          </div>
          <ul className="pipe__legend">
            {STATUSES.map(([key, label]) => (
              <li key={key}>
                <i className={`st st--${key}`} aria-hidden="true" />
                {label} <b>{counts[key]}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel table" aria-label="Applications">
        <div className="tabs" role="tablist" aria-label="Filter by status">
          {[['all', 'All'], ...STATUSES].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
            >
              {label} <span>{key === 'all' ? (apps?.length ?? 0) : counts[key]}</span>
            </button>
          ))}
        </div>

        {apps === null ? (
          <p className="quiet pad">Loading</p>
        ) : shown.length === 0 ? (
          <div className="empty pad">
            <h2>{apps.length ? `Nothing is ${LABEL[filter].toLowerCase()} right now` : 'No applications yet'}</h2>
            <p>
              {apps.length ? (
                'Pick another status above.'
              ) : (
                <>
                  Read a match and save it, or add one by hand. <Link to="/app/match">Read a match</Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Company and role</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">
                  Match
                </th>
                <th scope="col">Applied</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((app) => (
                <tr key={app.id}>
                  <td data-label="Company">
                    <b>{app.company}</b>
                    <span>{app.role}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`pill st--${app.status}`}>
                      <select
                        value={app.status}
                        onChange={(e) => setStatus(app, e.target.value)}
                        aria-label={`Status of ${app.company}`}
                      >
                        {STATUSES.map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td data-label="Match" className="num">
                    {app.match_score ?? <span className="dash">–</span>}
                  </td>
                  <td data-label="Applied">{day(app.applied_date) ?? <span className="dash">–</span>}</td>
                  <td className="acts">
                    {confirmId === app.id ? (
                      <>
                        <span>Delete it?</span>
                        <button type="button" className="link link--danger" onClick={() => remove(app)}>
                          Yes, delete
                        </button>
                        <button type="button" className="link" onClick={() => setConfirmId(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        {app.link && (
                          <a className="link" href={app.link} target="_blank" rel="noreferrer">
                            Post
                          </a>
                        )}
                        <button
                          type="button"
                          className="link"
                          onClick={() => (
                            setFormError(''),
                            setForm({ ...BLANK, ...app, applied_date: app.applied_date || '', match_score: app.match_score ?? '' })
                          )}
                        >
                          Edit
                        </button>
                        <button type="button" className="link" onClick={() => setConfirmId(app.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <dialog ref={dialog} className="sheet" onClose={() => setForm(null)} aria-labelledby="sheet-h">
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
              <button type="button" className="btn btn--soft" onClick={() => setForm(null)}>
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
