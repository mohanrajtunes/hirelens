import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// The hero object: a resume as a glowing glass sheet.
// It follows an empty box in the page (the "slot"), so the layout decides where
// it sits and the 3D only decides how it looks and turns.
//   reveal 0..1  the text writes itself top to bottom
//   scan   0..1  a light bar runs down the page and the skills light up
const W = 3.2
const H = 4.5

const HAVE = ['Python', 'Django', 'PostgreSQL', 'REST API', 'React', 'JWT', 'Git']
const MISSING = ['Docker', 'AWS']

// Draw the resume twice on 2D canvases: the text, and the highlighter marks.
function paint() {
  const w = 1024
  const h = 1440
  const make = () => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return [c, c.getContext('2d')]
  }
  const [text, t] = make()
  const [marks, m] = make()
  const display = '800 %px "Big Shoulders", "Arial Narrow", sans-serif'
  const body = '600 %px "Public Sans", system-ui, sans-serif'
  const font = (f, px) => f.replace('%', px)
  t.fillStyle = '#fff'
  t.textBaseline = 'alphabetic'
  let y = 150
  const x = 84

  t.font = font(display, 118)
  t.fillText('YOUR NAME', x, y)
  y += 58
  t.font = font(body, 34)
  t.fillText('Python Developer  ·  Django, DRF, React', x, y)

  const heading = (label) => {
    y += 96
    t.font = font(display, 46)
    t.fillText(label, x, y)
    t.fillRect(x, y + 16, w - x * 2, 3)
    y += 30
  }
  const bars = (widths) => {
    widths.forEach((bw) => {
      y += 38
      t.globalAlpha = 0.42
      t.fillRect(x, y - 14, (w - x * 2) * bw, 13)
      t.globalAlpha = 1
    })
  }

  heading('SUMMARY')
  bars([1, 0.94, 0.62])

  heading('SKILLS')
  y += 62
  t.font = font(body, 38)
  let cx = x
  const chip = (label, colour) => {
    const tw = t.measureText(label).width
    if (cx + tw > w - x) {
      cx = x
      y += 66
    }
    m.fillStyle = colour
    m.fillRect(cx - 12, y - 40, tw + 24, 54)
    t.fillText(label, cx, y)
    cx += tw + 46
  }
  HAVE.forEach((s) => chip(s, '#ffe23d'))

  heading('PROJECTS')
  y += 52
  t.font = font(body, 34)
  t.fillText('PingBoard, uptime monitoring', x, y)
  bars([0.96, 0.8])
  y += 62
  t.fillText('ShopFlow, multi-vendor store', x, y)
  bars([0.9, 0.7])

  heading('EDUCATION')
  bars([0.72, 0.5])

  // What the job asks for that this resume does not have. Only the scan shows it.
  y = h - 96
  m.font = font(body, 38)
  m.fillStyle = '#ff6b9d'
  let mx = x
  const label = 'Missing for this job:'
  m.fillRect(mx - 12, y - 40, m.measureText(label).width + 24, 54)
  m.fillStyle = '#0e1220'
  m.fillText(label, mx, y)
  mx += m.measureText(label).width + 46
  MISSING.forEach((s) => {
    const tw = m.measureText(s).width
    m.fillStyle = '#ff6b9d'
    m.fillRect(mx - 12, y - 40, tw + 24, 54)
    m.fillStyle = '#0e1220'
    m.fillText(s, mx, y)
    m.fillRect(mx - 4, y - 14, tw + 8, 4)
    mx += tw + 46
  })
  return [text, marks]
}

const VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const FRAG = `
precision highp float;
uniform sampler2D uText; uniform sampler2D uMarks;
uniform float uReveal; uniform float uScan; uniform float uTime; uniform float uOpacity;
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main(){
  vec2 size = vec2(${W.toFixed(1)}, ${H.toFixed(1)});
  vec2 d = abs(vUv - 0.5) * size - (size * 0.5 - 0.16);
  float r = length(max(d, 0.0)) - 0.16;            // rounded-rectangle distance, negative inside
  float mask = 1.0 - smoothstep(-0.006, 0.006, r);
  float rim = smoothstep(-0.07, 0.0, r) * mask;
  float y = 1.0 - vUv.y;                             // 0 at the top of the page
  float shown = 1.0 - smoothstep(uReveal - 0.06, uReveal, y);
  float writing = exp(-pow((y - uReveal) * 26.0, 2.0)) * step(0.002, uReveal) * step(uReveal, 0.998);
  float scanned = 1.0 - smoothstep(uScan - 0.012, uScan, y);
  float bar = exp(-pow((y - uScan) * 70.0, 2.0)) * step(0.002, uScan) * step(uScan, 0.998);
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.0);
  vec4 text = texture2D(uText, vUv);
  vec4 marks = texture2D(uMarks, vUv);
  float ink = text.a * shown;
  float lit = marks.a * scanned;
  vec3 glass = vec3(0.022, 0.045, 0.12) + vec3(0.04, 0.30, 1.0) * (0.07 + 0.55 * fres);
  glass += vec3(0.05, 0.25, 0.9) * 0.10 * (0.5 + 0.5 * sin(vUv.y * 9.0 + uTime * 0.6));
  vec3 col = mix(glass, marks.rgb, lit);
  col = mix(col, mix(vec3(0.86, 0.92, 1.0), vec3(0.05, 0.07, 0.13), lit), ink);
  col += vec3(0.25, 0.6, 1.0) * (bar * 1.6 + writing * 0.7);
  col += vec3(0.16, 0.5, 1.0) * rim * 1.1;
  float alpha = mask * (0.80 + 0.20 * max(max(ink, lit), rim));
  gl_FragColor = vec4(col, alpha * uOpacity);
}`

export default function ResumeScene({ slot, state }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    } catch {
      return // no WebGL: the page works without the 3D sheet
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const FOV = 32
    const DIST = 12
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
    camera.position.z = DIST

    const texText = new THREE.Texture()
    const texMarks = new THREE.Texture()
    ;[texText, texMarks].forEach((tx) => {
      tx.colorSpace = THREE.SRGBColorSpace
      tx.anisotropy = renderer.capabilities.getMaxAnisotropy()
    })
    const uniforms = {
      uText: { value: texText },
      uMarks: { value: texMarks },
      uReveal: { value: 0 },
      uScan: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, H), material)
    scene.add(sheet)

    const draw = () => {
      const [a, b] = paint()
      texText.image = a
      texMarks.image = b
      texText.needsUpdate = true
      texMarks.needsUpdate = true
    }
    draw()
    document.fonts?.ready.then(draw) // paint again once the real fonts are in

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      ptr.tx = e.clientX / window.innerWidth - 0.5
      ptr.ty = e.clientY / window.innerHeight - 0.5
    }
    const resize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    resize()

    let raf = 0
    const t0 = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const box = slot.current?.getBoundingClientRect()
      const s = state.current
      if (!box || box.bottom < -80 || box.top > window.innerHeight + 80 || s.opacity <= 0.001) {
        if (canvas.style.visibility !== 'hidden') canvas.style.visibility = 'hidden'
        return
      }
      if (canvas.style.visibility !== 'visible') canvas.style.visibility = 'visible'
      const time = (now - t0) / 1000
      // world units per CSS pixel at the sheet's depth
      const unit = (2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / window.innerHeight
      const fit = Math.min((box.height * unit) / H, (box.width * unit) / W)
      ptr.x += (ptr.tx - ptr.x) * 0.06
      ptr.y += (ptr.ty - ptr.y) * 0.06
      const float = still ? 0 : 1
      sheet.position.set(
        (box.left + box.width / 2 - window.innerWidth / 2) * unit,
        -(box.top + box.height / 2 - window.innerHeight / 2) * unit + Math.sin(time * 0.9) * 0.06 * float + s.lift,
        s.z,
      )
      sheet.scale.setScalar(fit * (s.scale + s.grow))
      sheet.rotation.set(
        s.rx + s.tilt + ptr.y * 0.28 * float + Math.sin(time * 0.7) * 0.025 * float,
        s.ry + s.spin + ptr.x * 0.5 * float + Math.sin(time * 0.5) * 0.05 * float,
        s.rz,
      )
      uniforms.uReveal.value = s.reveal
      uniforms.uScan.value = s.scan
      uniforms.uOpacity.value = s.opacity
      uniforms.uTime.value = time
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    const onVisible = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisible)
      sheet.geometry.dispose()
      material.dispose()
      texText.dispose()
      texMarks.dispose()
      renderer.dispose()
    }
  }, [slot, state])

  return <canvas ref={ref} className="scene3d" aria-hidden="true" />
}
