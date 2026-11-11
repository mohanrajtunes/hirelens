import { useEffect, useRef } from 'react'

// A slow blue light moving behind the page, drawn by a WebGL fragment shader.
// It renders at a low resolution on purpose: a glow has no sharp edges, so it
// costs almost nothing and still fills the screen.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uScroll; uniform vec2 uPtr; uniform float uPower;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(11.3, 7.7); a *= 0.5; } return v; }
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.07;
  vec2 q = vec2(fbm(p * 1.1 + vec2(t, -t * 0.7)), fbm(p * 1.1 + vec2(-t * 0.5, t) + 4.0));
  float n = fbm(p * 1.5 + q * 1.9 + vec2(0.0, uScroll * 2.2));
  float band = smoothstep(0.32, 0.80, n);
  vec3 col = vec3(0.012, 0.016, 0.036);
  col += vec3(0.04, 0.30, 1.0) * pow(band, 1.9) * 1.25 * uPower;
  col += vec3(0.0, 0.78, 0.9) * pow(smoothstep(0.56, 0.96, n + q.x * 0.25), 3.0) * 0.6 * uPower;
  col += vec3(0.05, 0.32, 1.0) * 0.22 * exp(-5.0 * length(p - uPtr)) * uPower;
  col *= 1.0 - 0.32 * smoothstep(0.35, 1.25, length(p * vec2(0.75, 1.0)));
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`

export default function Backdrop({ power = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return // no WebGL: the plain black page is the fallback

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (name) => gl.getUniformLocation(prog, name)
    const uRes = u('uRes'), uTime = u('uTime'), uScroll = u('uScroll'), uPtr = u('uPtr'), uPower = u('uPower')

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ptr = { x: 0.3, y: 0.1, tx: 0.3, ty: 0.1 }
    let raf = 0
    let start = performance.now()

    const resize = () => {
      const scale = 0.5 // half resolution is plenty for a glow
      canvas.width = Math.max(2, Math.round(window.innerWidth * scale))
      canvas.height = Math.max(2, Math.round(window.innerHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (still) draw(performance.now())
    }
    const draw = (now) => {
      ptr.x += (ptr.tx - ptr.x) * 0.04
      ptr.y += (ptr.ty - ptr.y) * 0.04
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, still ? 12 : (now - start) / 1000 + 12)
      gl.uniform1f(uScroll, window.scrollY / max)
      gl.uniform2f(uPtr, ptr.x, ptr.y)
      gl.uniform1f(uPower, power)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = (now) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const onMove = (e) => {
      ptr.tx = (e.clientX - window.innerWidth / 2) / window.innerHeight
      ptr.ty = -(e.clientY - window.innerHeight / 2) / window.innerHeight
    }
    const onVisible = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !still) raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisible)
    if (still) {
      window.addEventListener('scroll', () => draw(0), { passive: true })
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisible)
      start = 0
    }
  }, [power])

  return <canvas ref={ref} className="backdrop" aria-hidden="true" />
}
