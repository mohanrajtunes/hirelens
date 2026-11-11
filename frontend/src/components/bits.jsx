import { Link } from 'react-router-dom'
import { segment } from '../lib/skills.js'

export function Logo({ size = 28 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeWidth="3.6" />
      <rect x="1" y="13.7" width="30" height="4.6" rx="2.3" fill="currentColor" />
    </svg>
  )
}

const PATHS = {
  home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
  lens: 'M10.5 3a7.5 7.5 0 1 0 4.6 13.4l4.2 4.3 1.5-1.5-4.3-4.2A7.5 7.5 0 0 0 10.5 3zm0 2.2a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6z',
  board: 'M4 4h4.5v16H4zm5.8 0h4.4v10H9.8zM15.5 4H20v13h-4.5z',
  gap: 'M4 20V10h3.5v10zm6.2 0V4h3.6v16zm6.3 0v-7H20v7z',
  search: 'M10.5 3a7.5 7.5 0 1 0 4.6 13.4l4.2 4.3 1.5-1.5-4.3-4.2A7.5 7.5 0 0 0 10.5 3zm0 2.2a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6z',
  out: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5v-2.2H6.2V6.2H10zm5.2 3.4-1.6 1.5 2 2H9v2.2h6.6l-2 2 1.6 1.5L20 12z',
  plus: 'M10.9 4h2.2v6.9H20v2.2h-6.9V20h-2.2v-6.9H4v-2.2h6.9z',
  arrow: 'M13.2 5 20 12l-6.8 7-1.6-1.6 4.2-4.3H4v-2.2h11.8l-4.2-4.3z',
  github:
    'M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.2.65-.46v-1.6c-2.64.57-3.2-1.27-3.2-1.27-.43-1.1-1.06-1.39-1.06-1.39-.86-.59.07-.58.07-.58.96.07 1.46.98 1.46.98.85 1.45 2.23 1.03 2.77.79.09-.62.33-1.03.6-1.27-2.11-.24-4.33-1.05-4.33-4.69 0-1.04.37-1.88.98-2.55-.1-.24-.42-1.2.09-2.51 0 0 .8-.26 2.61.97a9.1 9.1 0 0 1 4.76 0c1.81-1.23 2.6-.97 2.6-.97.52 1.31.2 2.27.1 2.51.61.67.98 1.51.98 2.55 0 3.65-2.22 4.45-4.34 4.68.34.3.64.87.64 1.76v2.6c0 .26.17.56.66.46A9.5 9.5 0 0 0 12 2.5z',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.2 2.2v.9L12 12.7l6.800-4.600v-.9zm13.600 3.500L12 15.300l-6.800-4.600v6.100h13.600z',
  doc: 'M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1.200 2.200v13.600h9.600V8h-3.600V5.200zM9 11h6v1.800H9zm0 3.600h6v1.800H9z',
  check: 'M9.500 16.600 5.300 12.400l-1.600 1.600 5.800 5.800L20.300 9l-1.600-1.600z',
  upload: 'M12 3.500 6.500 9l1.600 1.500 2.800-2.800V16h2.200V7.700l2.800 2.800L17.500 9zM4 18.300h16v2.200H4z',
}

export function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

// One highlighter stroke: lime for a skill you have, coral for one you lack.
export function Mk({ kind = 'hit', children }) {
  return <span className={`mk mk--${kind}`}>{children}</span>
}

// A text with its skills marked up.
export function Marked({ text, hits, misses }) {
  return segment(text, hits, misses).map((part, i) =>
    part.kind ? (
      <Mk key={`${i}-${part.text}-${part.kind}`} kind={part.kind}>
        {part.text}
      </Mk>
    ) : (
      <span key={`${i}-t`}>{part.text}</span>
    ),
  )
}

// Wrap a word in <i> to set it in the italic serif. Used in headings.
export function Em({ children }) {
  return <em className="em">{children}</em>
}

// What a page shows when there is nothing in it yet: what goes here, and the one thing to do next.
export function Empty({ icon = 'doc', title, text, to, cta, children }) {
  return (
    <div className="panel empty">
      <span className="empty__icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="row">
        {to && (
          <Link to={to} className="btn">
            {cta} <Icon name="arrow" size={18} />
          </Link>
        )}
        {children}
      </div>
    </div>
  )
}

// Grey placeholder bars shown while something loads.
export function Skel({ lines = 3, className = '' }) {
  return (
    <div className={`skel ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <i key={i} style={{ width: `${[92, 100, 68, 84, 56][i % 5]}%` }} />
      ))}
    </div>
  )
}
