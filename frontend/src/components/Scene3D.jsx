import { useEffect, useRef } from 'react'
import {
  AmbientLight, BoxGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry,
  Group, Mesh, MeshPhysicalMaterial, PerspectiveCamera, PMREMGenerator, Scene, Shape, TorusGeometry, WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { scene as dials } from '../lib/scene.js'

// Glossy toy-like objects that float behind every page, each one a piece of
// a job hunt: a resume, a lens, a briefcase, an envelope, a paper plane, a
// target, a tick, an AI chip, tracker cards. Scrolling moves them between
// "stations": scattered around the edges, then flown together into a cluster.

const COLORS = { pink: 0xff4326, blue: 0x8f8f99, orange: 0xff9a3d, yellow: 0xff9a3d, violet: 0x3a3a40, aqua: 0xd7d7dc, lime: 0xff4326, white: 0xf4f2ee, ink: 0x17171a }

const gloss = (color, extra = {}) =>
  new MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, ...extra })

function star() {
  const s = new Shape()
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? 0.42 : 1
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 6, curveSegments: 4 })
  g.center()
  return new Mesh(g, gloss(COLORS.yellow))
}

function lens() {
  const g = new Group()
  g.add(new Mesh(new TorusGeometry(1, 0.2, 24, 64), gloss(COLORS.pink)))
  const glass = new Mesh(new CylinderGeometry(0.9, 0.9, 0.08, 48), gloss(COLORS.aqua, { transparent: true, opacity: 0.38, roughness: 0.05 }))
  glass.rotation.x = Math.PI / 2
  g.add(glass)
  const handle = new Mesh(new CapsuleGeometry(0.17, 1.15, 8, 20), gloss(COLORS.violet))
  handle.position.set(1.25, -1.25, 0)
  handle.rotation.z = Math.PI / 4
  g.add(handle)
  return g
}

function sheet() {
  const g = new Group()
  g.add(new Mesh(new BoxGeometry(1.7, 2.3, 0.07), gloss(COLORS.white, { roughness: 0.5, clearcoat: 0.3 })))
  const bar = (w, y, color) => {
    const m = new Mesh(new BoxGeometry(w, 0.15, 0.04), gloss(color))
    m.position.set(-0.6 + w / 2, y, 0.05)
    g.add(m)
  }
  bar(0.9, 0.8, COLORS.ink)
  bar(1.2, 0.42, COLORS.lime)
  bar(0.8, 0.1, COLORS.pink)
  bar(1.1, -0.22, COLORS.lime)
  bar(0.6, -0.54, COLORS.blue)
  return g
}

const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new Mesh(new BoxGeometry(w, h, d), gloss(color))
  m.position.set(x, y, z)
  return m
}
const group = (...parts) => {
  const g = new Group()
  parts.forEach((p) => g.add(p))
  return g
}

// A briefcase: the job itself.
function briefcase() {
  const handle = new Mesh(new TorusGeometry(0.34, 0.07, 12, 32, Math.PI), gloss(COLORS.ink))
  handle.position.y = 0.52
  return group(box(1.7, 1.05, 0.5, COLORS.orange), box(1.74, 0.16, 0.54, COLORS.ink, 0, 0.12), box(0.26, 0.3, 0.6, COLORS.yellow, 0, 0.1), handle)
}

// An envelope: the note you send.
function envelope() {
  const flap = new Shape()
  flap.moveTo(-0.85, 0.5)
  flap.lineTo(0.85, 0.5)
  flap.lineTo(0, -0.12)
  flap.closePath()
  const top = new Mesh(new ExtrudeGeometry(flap, { depth: 0.06, bevelEnabled: false }), gloss(COLORS.pink))
  top.position.z = 0.06
  return group(box(1.7, 1.05, 0.12, COLORS.white), top)
}

// A paper plane: the application leaving.
function plane() {
  const g = new ConeGeometry(0.7, 1.9, 3)
  g.rotateX(Math.PI / 2)
  g.scale(1, 0.28, 1)
  return new Mesh(g, gloss(COLORS.blue, { flatShading: true }))
}

// A target: the match score.
function target() {
  const ring = (r, color, z) => {
    const m = new Mesh(new CylinderGeometry(r, r, 0.14, 48), gloss(color))
    m.rotation.x = Math.PI / 2
    m.position.z = z
    return m
  }
  const dart = new Mesh(new ConeGeometry(0.09, 0.9, 16), gloss(COLORS.lime))
  dart.rotation.x = -Math.PI / 2
  dart.position.z = 0.6
  return group(ring(1, COLORS.pink, 0), ring(0.68, COLORS.white, 0.06), ring(0.36, COLORS.pink, 0.12), dart)
}

// A tick badge: a skill you have.
function tick() {
  const disc = new Mesh(new CylinderGeometry(0.75, 0.75, 0.22, 48), gloss(COLORS.lime))
  disc.rotation.x = Math.PI / 2
  const short = new Mesh(new CapsuleGeometry(0.09, 0.3, 6, 12), gloss(COLORS.ink))
  short.position.set(-0.22, -0.08, 0.16)
  short.rotation.z = Math.PI / 4
  const long = new Mesh(new CapsuleGeometry(0.09, 0.62, 6, 12), gloss(COLORS.ink))
  long.position.set(0.14, 0.04, 0.16)
  long.rotation.z = -Math.PI / 5
  return group(disc, short, long)
}

// A chip: the AI doing the read.
function chip() {
  const g = group(box(1.1, 1.1, 0.26, COLORS.violet), box(0.5, 0.5, 0.3, COLORS.aqua))
  for (let i = -1; i <= 1; i += 1) {
    g.add(box(0.12, 0.3, 0.1, COLORS.yellow, i * 0.32, 0.68), box(0.12, 0.3, 0.1, COLORS.yellow, i * 0.32, -0.68))
    g.add(box(0.3, 0.12, 0.1, COLORS.yellow, 0.68, i * 0.32), box(0.3, 0.12, 0.1, COLORS.yellow, -0.68, i * 0.32))
  }
  return g
}

// A stack of cards: the tracker board.
function cards() {
  return group(box(1.3, 0.8, 0.1, COLORS.aqua, -0.12, -0.14, -0.16), box(1.3, 0.8, 0.1, COLORS.yellow, 0, 0, 0), box(1.3, 0.8, 0.1, COLORS.pink, 0.12, 0.14, 0.16))
}

// A four-point sparkle: the AI again, smaller.
function sparkle() {
  const s = new Shape()
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 ? 0.28 : 1
    const a = (i / 8) * Math.PI * 2
    s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4 })
  g.center()
  return new Mesh(g, gloss(COLORS.violet))
}

// [object, size, place in the cluster (x, y, z)]
function build() {
  return [
    [sheet(), 1, [-0.5, 0.1, -0.5]],
    [lens(), 1, [0.5, -0.2, 0.9]],
    [briefcase(), 0.8, [-2.0, -1.5, 0.4]],
    [envelope(), 0.8, [2.0, 1.5, -0.2]],
    [target(), 0.72, [2.2, -1.5, 0.2]],
    [plane(), 0.8, [-2.0, 1.7, 0.3]],
  ]
}

const smooth = (t) => t * t * (3 - 2 * t)

export default function Scene3D() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let renderer
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      return // no WebGL: the page still works on its plain background
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const world = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    world.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    world.add(new AmbientLight(0xffffff, 0.5))
    const sun = new DirectionalLight(0xffffff, 1.6)
    sun.position.set(4, 6, 8)
    world.add(sun)
    const camera = new PerspectiveCamera(35, 1, 0.1, 80)
    camera.position.z = 15

    const items = build().map(([mesh, size, home], i) => {
      world.add(mesh)
      return { mesh, size, home, i, spin: [0.2 + (i % 3) * 0.13, 0.25 + (i % 4) * 0.1], phase: i * 1.7 }
    })

    let halfW = 6
    let halfH = 4
    let small = false
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      small = w < 800
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      halfH = Math.tan((35 * Math.PI) / 360) * camera.position.z
      halfW = halfH * camera.aspect
    }
    resize()

    // Where object i sits at station k. Even stations scatter the objects
    // around the right side and the corners; odd stations fly them together.
    const place = (item, k, out) => {
      const n = items.length
      if (k % 2) {
        const s = small ? 0.5 : 0.9
        out[0] = (small ? 0 : halfW * 0.5) + item.home[0] * s
        out[1] = (small ? halfH * 0.42 : 0) + item.home[1] * s
        out[2] = item.home[2]
      } else {
        const fx = (item.i * 0.618 + k * 0.31) % 1
        const fy = (item.i * 0.381 + k * 0.17) % 1
        out[0] = small ? halfW * (fx * 1.8 - 0.9) : halfW * (0.22 + 0.74 * fx)
        out[1] = halfH * (fy * 1.8 - 0.9)
        out[2] = -1.5 + (item.i % 3)
      }
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5
      pointer.ty = e.clientY / window.innerHeight - 0.5
    }
    const a = [0, 0, 0]
    const b = [0, 0, 0]
    let station = dials.shift
    let power = 0
    let time = 0
    let last = performance.now()
    let raf = 0

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      dials.kick *= 0.93
      time += dt * (1 + dials.kick * 6)
      const target = dials.shift + (window.scrollY / Math.max(1, window.innerHeight)) * 0.8
      const before = station
      station += (target - station) * (still ? 1 : 0.07)
      const speed = station - before
      power += (dials.power - power) * 0.06
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      const k = Math.floor(station)
      const t = smooth(station - k)
      for (const item of items) {
        place(item, k, a)
        place(item, k + 1, b)
        const m = item.mesh
        const depth = 0.4 + (item.i % 4) * 0.25
        m.position.set(
          a[0] + (b[0] - a[0]) * t - pointer.x * depth * 1.4,
          a[1] + (b[1] - a[1]) * t + pointer.y * depth * 1.1 + Math.sin(time * 0.9 + item.phase) * 0.16,
          a[2] + (b[2] - a[2]) * t + Math.sin(t * Math.PI) * 2.2,
        )
        m.rotation.x += dt * item.spin[0] + speed * 5
        m.rotation.y += dt * item.spin[1] + speed * 7
        const s = item.size * (small ? 0.62 : 1) * (0.5 + 0.5 * power) * (1 + dials.kick * 0.25)
        m.scale.setScalar(s)
      }
      renderer.render(world, camera)
      if (!still) raf = requestAnimationFrame(frame)
    }
    const redraw = () => still && frame(performance.now())
    if (still) {
      power = dials.power
      frame(performance.now())
      window.addEventListener('scroll', redraw, { passive: true })
    } else raf = requestAnimationFrame(frame)

    const onVisible = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !still) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const onResize = () => {
      resize()
      redraw()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', redraw)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisible)
      world.traverse((o) => {
        o.geometry?.dispose()
        o.material?.dispose()
      })
      pmrem.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="scene" aria-hidden="true">
      <canvas ref={ref} className="scene__gl" />
    </div>
  )
}
