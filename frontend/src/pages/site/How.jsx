import { useEffect, useRef } from 'react'
import { gsap, isWide, ScrollTrigger, SplitText } from '../../lib/motion.js'
import { useReveals } from '../../lib/reveal.js'
import { setScene } from '../../lib/scene.js'
import { TLink } from '../../lib/nav.jsx'
import { Em, Icon, Mk } from '../../components/bits.jsx'

const STEPS = [
  {
    n: '01',
    title: ['Drop in your ', 'resume.'],
    text: 'One PDF, 2 MB at most. HireLens pulls the text out and keeps it in your account, so you upload once and reuse it.',
    fact: 'pypdf reads the file. A fake PDF is turned away.',
  },
  {
    n: '02',
    title: ['Paste the ', 'job post.'],
    text: 'The whole thing, straight from the listing. No form to fill and no fields to map. Messy formatting is fine.',
    fact: 'Any length. The full text goes to the reader.',
  },
  {
    n: '03',
    title: ['It gets read ', 'twice.'],
    text: 'First a plain keyword match against 48 skills. Then an AI read of the whole post against your whole resume.',
    fact: 'Score = 40% keywords + 60% AI read.',
  },
  {
    n: '04',
    title: ['Send it, then ', 'track it.'],
    text: 'Get a short note in the tone you pick, save the job, and drag it across the board as things happen.',
    fact: 'The note is written only from your resume.',
  },
]

function Art({ i }) {
  if (i === 0)
    return (
      <div className="art art--drop">
        <div className="art__sheet">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="art__tray">
          <Icon name="upload" size={22} /> resume.pdf
        </div>
      </div>
    )
  if (i === 1)
    return (
      <div className="art art--type">
        <p className="art__typed">
          Backend Developer. Python, Django, PostgreSQL, Docker and AWS. REST API design, JWT and Git.
        </p>
      </div>
    )
  if (i === 2)
    return (
      <div className="art art--read">
        <p>
          <Mk>Python</Mk> <Mk>Django</Mk> <Mk kind="miss">Docker</Mk> <Mk>JWT</Mk> <Mk kind="miss">AWS</Mk>
        </p>
        <ul>
          <li>
            <span>Keywords</span>
            <i style={{ '--w': 0.6 }} />
          </li>
          <li>
            <span>AI read</span>
            <i style={{ '--w': 0.78 }} />
          </li>
        </ul>
      </div>
    )
  return (
    <div className="art art--track">
      <span>Saved</span>
      <span>Applied</span>
      <span>Offer</span>
      <div className="art__job">
        <b>Northwind</b> 71
      </div>
    </div>
  )
}

export default function How() {
  const root = useRef(null)
  useEffect(() => setScene({ power: 0.9, shift: 2 }), [])

  useReveals(root, (ok) => {
    if (!ok) return
    SplitText.create('.top h1', {
      type: 'chars',
      mask: 'chars',
      onSplit: (self) => gsap.from(self.chars, { yPercent: 120, duration: 1, ease: 'expo.out', stagger: 0.03, delay: 0.2 }),
    })

    // Small loops inside each step.
    gsap.timeline({ repeat: -1, repeatDelay: 0.9 })
      .fromTo('.art__sheet', { y: -150, rotation: -18, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.9, ease: 'bounce.out' })
      .to('.art__tray', { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1 }, '-=0.35')
      .to('.art__sheet', { autoAlpha: 0, scale: 0.8, duration: 0.3 }, '+=1.1')
    SplitText.create('.art__typed', {
      type: 'chars',
      onSplit: (self) => gsap.from(self.chars, { autoAlpha: 0, duration: 0.01, stagger: 0.035, repeat: -1, repeatDelay: 1.6 }),
    })
    gsap.timeline({ repeat: -1, repeatDelay: 1.2 })
      .from('.art--read .mk', { scale: 0, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.12 })
      .from('.art--read li i', { scaleX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 }, '-=0.2')
    gsap.timeline({ repeat: -1, repeatDelay: 0.7, defaults: { duration: 0.65, ease: 'back.inOut(1.5)' } })
      .to('.art__job', { xPercent: 108 }, '+=0.6')
      .to('.art__job', { xPercent: 216 }, '+=0.6')
      .to('.art__job', { xPercent: 0, duration: 0.8 }, '+=1')

    if (!isWide()) {
      gsap.utils.toArray('.step').forEach((el) =>
        gsap.from(el, { y: 60, autoAlpha: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%', once: true } }),
      )
      return
    }
    // The four steps sit in one row and the page scroll moves the row sideways.
    const track = root.current.querySelector('.steps__track')
    const move = gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: '.steps',
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
    gsap.fromTo('.steps__bar i', { scaleX: 0.02 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top top', end: () => `+=${track.scrollWidth - window.innerWidth}`, scrub: 0.3 } })
    gsap.utils.toArray('.step').forEach((el) => {
      gsap.fromTo(el.querySelector('.step__n'), { xPercent: 30 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } })
      gsap.from(el.querySelector('.art'), { scale: 0.7, rotation: 6, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)', scrollTrigger: { trigger: el, containerAnimation: move, start: 'left 70%', toggleActions: 'play none none reverse' } })
    })
    return () => ScrollTrigger.refresh()
  })

  return (
    <div ref={root}>
      <section className="top">
        <p className="tag">
          <i /> How it works
        </p>
        <h1>
          Four steps. <Em>One scroll.</Em>
        </h1>
        <p className="top__sub" data-rise>
          From a PDF and a pasted job post to a note you can send. Keep scrolling and the steps slide past.
        </p>
      </section>

      <section className="steps" aria-label="The four steps">
        <div className="steps__track">
          {STEPS.map((s, i) => (
            <article className="step" key={s.n}>
              <b className="step__n" aria-hidden="true">
                {s.n}
              </b>
              <div className="step__body">
                <h2>
                  {s.title[0]}
                  <Em>{s.title[1]}</Em>
                </h2>
                <p>{s.text}</p>
                <p className="step__fact mono">{s.fact}</p>
              </div>
              <div className="step__art glass">
                <Art i={i} />
              </div>
            </article>
          ))}
        </div>
        <div className="steps__bar" aria-hidden="true">
          <i />
        </div>
      </section>

      <section className="close">
        <h2 data-split>
          That is the <Em>whole trick.</Em>
        </h2>
        <div className="hero__cta" data-rise>
          <TLink to="/play" className="btn magnet">
            Try the playground <Icon name="arrow" />
          </TLink>
          <TLink to="/stack" className="btn btn--ghost magnet">
            See what runs it
          </TLink>
        </div>
      </section>
    </div>
  )
}
