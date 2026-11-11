import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(
  useGSAP, ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin,
  DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin,
)

// True when the visitor has not asked the system to reduce motion.
export const motionOK = () => window.matchMedia('(prefers-reduced-motion: no-preference)').matches
export const isWide = () => window.matchMedia('(min-width: 900px)').matches
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export { gsap, ScrollTrigger, SplitText, Flip, Draggable, useGSAP }
