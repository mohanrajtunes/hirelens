import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { scene as dials } from '../lib/scene.js'

// Three bundles of light fibres that twist, pinch into a bright core and fan
// out again. Every fibre is a thin strip built in the vertex shader, drawn
// with additive blending, so crossings glow. One canvas for the whole site.

const BANDS = 3
const FIBRES = 64
const SEGS = 150

const VERT = /* glsl */ `
attribute float aT;
attribute float aSide;
attribute float aSeed;
attribute float aBand;
uniform float uTime;
uniform float uScroll;
uniform float uShift;
uniform float uAspect;
uniform float uWidth;
varying float vT;
varying float vSide;
varying float vSeed;
varying float vWide;

vec3 path(float t) {
  float tt = uTime * 0.11 + aBand * 2.1 + uShift;
  float x = mix(-10.5, 10.5, t);
  float y = sin(t * 3.4 + tt + aBand * 1.3 + uScroll * 1.6) * (1.5 + aBand * 0.45)
          + (aBand - 1.0) * 1.25
          + sin(t * 8.5 - tt * 1.6) * 0.22;
  float z = cos(t * 2.6 + tt * 0.8 + aBand) * 1.9;
  return vec3(x, y, z);
}

vec3 fibre(float t) {
  vec3 c = path(t);
  float ang = aSeed * 6.2831 + t * (4.5 + aBand * 2.0) + uTime * 0.22;
  float pinch = 0.5 + 0.5 * sin(t * 6.2831 + uTime * 0.17 + aBand * 1.7 + uScroll * 2.0);
  float spread = 0.05 + 1.55 * pinch * pinch * (0.35 + 0.65 * fract(aSeed * 7.3));
  return c + vec3(0.0, cos(ang), sin(ang)) * spread;
}

void main() {
  vec4 p = projectionMatrix * modelViewMatrix * vec4(fibre(aT), 1.0);
  vec4 q = projectionMatrix * modelViewMatrix * vec4(fibre(aT + 0.004), 1.0);
  vec2 dir = (q.xy / q.w - p.xy / p.w) * vec2(uAspect, 1.0);
  dir = normalize(dir + vec2(0.00001, 0.0));
  vec2 n = vec2(-dir.y, dir.x);
  n.x /= uAspect;
  float wide = step(0.86, fract(aSeed * 5.1));
  vWide = wide;
  p.xy += n * aSide * uWidth * mix(1.0, 7.0, wide) * p.w;
  vT = aT;
  vSide = aSide;
  vSeed = aSeed;
  gl_Position = p;
}
`

const FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uPower;
varying float vT;
varying float vSide;
varying float vSeed;
varying float vWide;

void main() {
  float edge = 1.0 - abs(vSide);
  edge *= edge;
  float ends = smoothstep(0.0, 0.14, vT) * smoothstep(1.0, 0.86, vT);
  float pulse = 0.5 + 0.5 * sin(vT * 16.0 - uTime * 1.3 + vSeed * 40.0);
  vec3 violet = vec3(0.47, 0.30, 1.0);
  vec3 magenta = vec3(1.0, 0.20, 0.72);
  vec3 peach = vec3(1.0, 0.62, 0.40);
  float k = fract(vSeed * 3.7) + 0.3 * sin(vT * 4.0 + uTime * 0.2);
  vec3 col = mix(violet, magenta, smoothstep(0.2, 0.9, k));
  col = mix(col, peach, pow(fract(vSeed * 11.3), 7.0));
  float glow = edge * ends * (0.35 + 0.65 * pulse) * uPower * mix(1.0, 0.3, vWide);
  gl_FragColor = vec4(col * glow, 1.0);
}
`

function buildGeometry() {
  const lines = BANDS * FIBRES
  const perLine = (SEGS + 1) * 2
  const aT = new Float32Array(lines * perLine)
  const aSide = new Float32Array(lines * perLine)
  const aSeed = new Float32Array(lines * perLine)
  const aBand = new Float32Array(lines * perLine)
  const index = new Uint32Array(lines * SEGS * 6)
  let v = 0
  let i = 0
  for (let l = 0; l < lines; l += 1) {
    const seed = Math.random()
    const band = Math.floor(l / FIBRES)
    const base = v
    for (let s = 0; s <= SEGS; s += 1) {
      for (const side of [-1, 1]) {
        aT[v] = s / SEGS
        aSide[v] = side
        aSeed[v] = seed
        aBand[v] = band
        v += 1
      }
    }
    for (let s = 0; s < SEGS; s += 1) {
      const a = base + s * 2
      index[i++] = a
      index[i++] = a + 1
      index[i++] = a + 2
      index[i++] = a + 1
      index[i++] = a + 3
      index[i++] = a + 2
    }
  }
  const g = new THREE.BufferGeometry()
  // Positions are computed in the shader. Three still wants the attribute.
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines * perLine * 3), 3))
  g.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
  g.setAttribute('aSide', new THREE.BufferAttribute(aSide, 1))
  g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1))
  g.setAttribute('aBand', new THREE.BufferAttribute(aBand, 1))
  g.setIndex(new THREE.BufferAttribute(index, 1))
  return g
}

export default function Ribbons() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    } catch {
      canvas.classList.add('is-flat') // no WebGL: the CSS gradient carries the page
      return
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setClearColor(0x0a0612, 1)
    const world = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60)
    camera.position.set(0, 0, 11)

    const uniforms = {
      uTime: { value: 20 },
      uScroll: { value: 0 },
      uShift: { value: 0 },
      uAspect: { value: 1 },
      uWidth: { value: 0.004 },
      uPower: { value: 0 },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const geometry = buildGeometry()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    world.add(mesh)

    let dim = 1 // phones get a quieter scene
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5
      pointer.ty = e.clientY / window.innerHeight - 0.5
    }
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const small = w < 700
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // Tall phones see the bundle from further back so it still crosses the screen.
      camera.position.z = w / h < 1 ? 15 : 11
      camera.updateProjectionMatrix()
      uniforms.uAspect.value = w / h
      uniforms.uWidth.value = small ? 0.0034 : 0.0036
      dim = small ? 0.72 : 1
    }
    resize()

    let raf = 0
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      dials.kick *= 0.94
      uniforms.uTime.value += dt * (1 + dials.kick * 9)
      // the light is loudest at the top of a page and calms as you read down
      const calm = 1 - 0.45 * Math.min(1, window.scrollY / Math.max(1, window.innerHeight))
      uniforms.uPower.value += (dials.power * calm * dim - uniforms.uPower.value) * 0.05
      uniforms.uShift.value += (dials.shift - uniforms.uShift.value) * 0.04
      uniforms.uScroll.value += (window.scrollY / Math.max(1, window.innerHeight) - uniforms.uScroll.value) * 0.08
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      mesh.rotation.y = pointer.x * 0.28
      mesh.rotation.x = pointer.y * 0.2
      mesh.rotation.z = -0.22 + uniforms.uScroll.value * 0.05
      renderer.render(world, camera)
      if (!still) raf = requestAnimationFrame(frame)
    }
    if (still) {
      uniforms.uPower.value = dials.power
      frame(performance.now())
    } else raf = requestAnimationFrame(frame)

    const onVisible = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !still) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisible)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="scene" aria-hidden="true">
      <canvas ref={ref} className="scene__gl" />
      <div className="scene__veil" />
    </div>
  )
}
