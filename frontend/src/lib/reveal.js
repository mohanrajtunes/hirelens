import { gsap, motionOK, useGSAP } from './motion.js'

// Scroll on the public pages works like a page change: each section slides up
// over the one before it and opens from a rounded window to full width, while
// the section underneath sinks back and dims.
export function useReveals(scope, extra, deps = []) {
  useGSAP(
    () => {
      const ok = motionOK()
      if (ok) {
        const panels = gsap.utils.toArray('.panelsec')
        panels.forEach((el, i) => {
          gsap.fromTo(
            el,
            { clipPath: 'inset(14% 7% 0% 7% round 28px)', y: 90 },
            {
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
              y: 0,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: 0.4 },
            },
          )
          const prev = i ? panels[i - 1].firstElementChild : scope.current.querySelector('.hero__copy, .top')
          if (prev)
            gsap.to(prev, {
              autoAlpha: 0.25,
              scale: 0.96,
              transformOrigin: '50% 100%',
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 70%', end: 'top 10%', scrub: 0.4 },
            })
        })
      }
      extra?.(ok)
    },
    { scope, dependencies: deps },
  )
}
