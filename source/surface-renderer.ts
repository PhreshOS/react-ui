/** Concrete values consumed by the shared Surface material renderer. */
export interface SurfaceMaterial {
  readonly color: string
  readonly grain: number
  readonly animation: number
  readonly opacity: number
}

/** One live registration in the document's shared Surface renderer. */
export interface SurfaceRegistration {
  readonly update: (material: SurfaceMaterial) => void
  readonly unregister: () => void
}

const renderers = new WeakMap<Document, SurfaceRenderer | null>()

/** Registers one Surface with the document's shared WebGL renderer. */
export function registerSurface(element: HTMLElement, canvas: HTMLCanvasElement, material: SurfaceMaterial): SurfaceRegistration | null {
  const document = element.ownerDocument
  let renderer = renderers.get(document)

  if (renderer === undefined) {
    renderer = SurfaceRenderer.create(document)
    renderers.set(document, renderer)
  }

  return renderer?.register(element, canvas, material) ?? null
}

interface SurfaceTarget {
  readonly canvas: HTMLCanvasElement
  readonly element: HTMLElement
  readonly output: ImageBitmapRenderingContext
  readonly restoreLayout: () => void
  readonly seed: number
  color: readonly [number, number, number, number]
  material: SurfaceMaterial
}

class SurfaceRenderer {
  readonly #canvas: OffscreenCanvas
  readonly #document: Document
  readonly #gl: WebGL2RenderingContext
  readonly #program: WebGLProgram
  readonly #instanceBuffer: WebGLBuffer
  readonly #resolution: WebGLUniformLocation
  readonly #time: WebGLUniformLocation
  readonly #pixelRatio: WebGLUniformLocation
  readonly #targets = new Set<SurfaceTarget>()
  #frame = 0
  #nextSeed = 1.7

  static create(document: Document) {
    if (typeof OffscreenCanvas === "undefined") return null

    const canvas = new OffscreenCanvas(1, 1)
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    })

    if (!gl) return null

    try {
      return new SurfaceRenderer(document, canvas, gl)
    } catch {
      return null
    }
  }

  private constructor(document: Document, canvas: OffscreenCanvas, gl: WebGL2RenderingContext) {
    this.#canvas = canvas
    this.#document = document
    this.#gl = gl
    this.#program = createProgram(gl, vertexShader, fragmentShader)
    this.#instanceBuffer = required(gl.createBuffer(), "Could not create the Surface instance buffer.")
    this.#resolution = uniform(gl, this.#program, "u_resolution")
    this.#time = uniform(gl, this.#program, "u_time")
    this.#pixelRatio = uniform(gl, this.#program, "u_pixelRatio")

    this.#prepareGeometry()
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.DEPTH_TEST)
  }

  register(element: HTMLElement, canvas: HTMLCanvasElement, material: SurfaceMaterial): SurfaceRegistration | null {
    const output = canvas.getContext("bitmaprenderer")
    if (!output) return null

    const target = {
      canvas,
      element,
      output,
      restoreLayout: prepareSurfaceLayout(element),
      seed: this.#nextSeed,
      color: cssColor(material.color, this.#document),
      material
    } satisfies SurfaceTarget
    this.#nextSeed += 7.91
    this.#targets.add(target)
    this.#start()

    return {
      update: value => {
        target.material = value
        target.color = cssColor(value.color, this.#document)
      },
      unregister: () => {
        this.#targets.delete(target)
        target.restoreLayout()
        canvas.width = 1
        canvas.height = 1
        if (this.#targets.size === 0) this.#stop()
      }
    }
  }

  #start() {
    if (this.#frame) return
    this.#frame = this.#document.defaultView?.requestAnimationFrame(this.#render) ?? 0
  }

  #stop() {
    this.#document.defaultView?.cancelAnimationFrame(this.#frame)
    this.#frame = 0
  }

  #prepareGeometry() {
    const gl = this.#gl
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const quadBuffer = required(gl.createBuffer(), "Could not create the Surface geometry buffer.")

    gl.useProgram(this.#program)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)

    const corner = gl.getAttribLocation(this.#program, "a_corner")
    gl.enableVertexAttribArray(corner)
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.#instanceBuffer)
    const stride = 12 * Float32Array.BYTES_PER_ELEMENT
    instanceAttribute(gl, this.#program, "a_rect", 4, stride, 0)
    instanceAttribute(gl, this.#program, "a_radius", 1, stride, 4)
    instanceAttribute(gl, this.#program, "a_seed", 1, stride, 5)
    instanceAttribute(gl, this.#program, "a_color", 3, stride, 6)
    instanceAttribute(gl, this.#program, "a_grain", 1, stride, 9)
    instanceAttribute(gl, this.#program, "a_animation", 1, stride, 10)
    instanceAttribute(gl, this.#program, "a_opacity", 1, stride, 11)
  }

  #render = (now: number) => {
    const gl = this.#gl
    const view = this.#document.defaultView
    if (!view) {
      this.#stop()
      return
    }

    const ratio = Math.min(view.devicePixelRatio || 1, 2)
    gl.useProgram(this.#program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#instanceBuffer)
    gl.uniform1f(this.#time, now / 1000)
    gl.uniform1f(this.#pixelRatio, ratio)

    this.#targets.forEach(target => {
      if (!target.element.isConnected || !target.canvas.isConnected) return

      const rect = target.element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const width = Math.max(1, Math.ceil(rect.width * ratio))
      const height = Math.max(1, Math.ceil(rect.height * ratio))
      if (this.#canvas.width !== width) this.#canvas.width = width
      if (this.#canvas.height !== height) this.#canvas.height = height

      const [red, green, blue, colorOpacity] = target.color
      const computed = view.getComputedStyle(target.element)
      const instance = new Float32Array([
        0,
        0,
        rect.width,
        rect.height,
        resolveRadius(computed.borderTopLeftRadius, rect),
        target.seed,
        red,
        green,
        blue,
        target.material.grain,
        target.material.animation,
        target.material.opacity * colorOpacity
      ])

      gl.viewport(0, 0, width, height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bufferData(gl.ARRAY_BUFFER, instance, gl.DYNAMIC_DRAW)
      gl.uniform2f(this.#resolution, rect.width, rect.height)
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1)

      if (target.canvas.width !== width) target.canvas.width = width
      if (target.canvas.height !== height) target.canvas.height = height
      target.output.transferFromImageBitmap(this.#canvas.transferToImageBitmap())
    })

    this.#frame = view.requestAnimationFrame(this.#render)
  }
}

export function prepareSurfaceLayout(element: HTMLElement) {
  const view = element.ownerDocument.defaultView
  const computed = view?.getComputedStyle(element)
  const position = element.style.position
  const isolation = element.style.isolation
  const ownsPosition = computed?.position === "static"
  const ownsIsolation = computed?.isolation !== "isolate"

  if (ownsPosition) element.style.position = "relative"
  if (ownsIsolation) element.style.isolation = "isolate"

  return () => {
    if (ownsPosition) element.style.position = position
    if (ownsIsolation) element.style.isolation = isolation
  }
}

function resolveRadius(value: string, rect: DOMRect) {
  const number = Number.parseFloat(value) || 0
  return value.endsWith("%") ? Math.min(rect.width, rect.height) * number / 100 : number
}

function cssColor(color: string, document: Document): readonly [number, number, number, number] {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return [0, 0, 0, 1]

  canvas.width = 1
  canvas.height = 1
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const [red = 0, green = 0, blue = 0, alpha = 255] = context.getImageData(0, 0, 1, 1).data
  return [red / 255, green / 255, blue / 255, alpha / 255]
}

function instanceAttribute(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, size: number, stride: number, valueOffset: number) {
  const location = gl.getAttribLocation(program, name)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, valueOffset * Float32Array.BYTES_PER_ELEMENT)
  gl.vertexAttribDivisor(location, 1)
}

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
  return required(gl.getUniformLocation(program, name), `Missing shader uniform ${name}.`)
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const program = required(gl.createProgram(), "Could not create the Surface shader program.")
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Could not link the Surface shader program.")

  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  return program
}

function compile(gl: WebGL2RenderingContext, kind: number, source: string) {
  const shader = required(gl.createShader(kind), "Could not create a Surface shader.")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Could not compile a Surface shader.")

  return shader
}

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message)
  return value
}

const vertexShader = `#version 300 es
precision highp float;
in vec2 a_corner;
in vec4 a_rect;
in float a_radius;
in float a_seed;
in vec3 a_color;
in float a_grain;
in float a_animation;
in float a_opacity;
uniform vec2 u_resolution;
out vec2 v_local;
flat out vec2 v_size;
flat out float v_radius;
flat out float v_seed;
flat out vec3 v_color;
flat out float v_grain;
flat out float v_animation;
flat out float v_opacity;
void main() {
  float padding = 2.0;
  vec2 paddedSize = a_rect.zw + vec2(padding * 2.0);
  vec2 center = a_rect.xy + a_rect.zw * 0.5;
  vec2 pixel = center + a_corner * paddedSize * 0.5;
  vec2 clip = pixel / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_local = a_corner * paddedSize * 0.5;
  v_size = a_rect.zw;
  v_radius = a_radius;
  v_seed = a_seed;
  v_color = a_color;
  v_grain = a_grain;
  v_animation = a_animation;
  v_opacity = a_opacity;
}
`

const fragmentShader = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_pixelRatio;
in vec2 v_local;
flat in vec2 v_size;
flat in float v_radius;
flat in float v_seed;
flat in vec3 v_color;
flat in float v_grain;
flat in float v_animation;
flat in float v_opacity;
out vec4 outputColor;
float roundedBox(vec2 point, vec2 halfSize, float radius) {
  vec2 distance = abs(point) - halfSize + radius;
  return min(max(distance.x, distance.y), 0.0) + length(max(distance, 0.0)) - radius;
}
float hash(vec2 point) {
  vec3 p = fract(vec3(point.xyx) * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
void main() {
  float distance = roundedBox(v_local, v_size * 0.5, min(v_radius, min(v_size.x, v_size.y) * 0.5));
  float antiAlias = max(fwidth(distance), 0.7 / u_pixelRatio);
  float body = 1.0 - smoothstep(-antiAlias, antiAlias, distance);
  float border = body * smoothstep(-1.0 - antiAlias, -antiAlias * 0.25, distance);
  vec2 grainPoint = (gl_FragCoord.xy + vec2(v_seed * 41.0, v_seed * 17.0)) / max(u_pixelRatio, 1.0);
  vec2 grainFrame = floor(u_time * v_animation) * vec2(19.17, 7.31);
  float fine = hash(floor(grainPoint * 1.18) + grainFrame);
  float clustered = hash(floor(grainPoint * 0.47) + grainFrame + 31.7);
  float grainValue = clamp(fine * 0.80 + clustered * 0.20, 0.0, 1.0);
  float backgroundTone = dot(v_color, vec3(0.2126, 0.7152, 0.0722));
  float grainTone = mix(backgroundTone, grainValue, v_grain);
  vec3 material = clamp(v_color + vec3(grainTone - backgroundTone), 0.0, 1.0);
  vec3 systemBorder = vec3(15.0, 17.0, 21.0) / 255.0;
  material = mix(material, systemBorder, border * 0.08);
  float alpha = body * v_opacity;
  outputColor = vec4(material * alpha, alpha);
}
`
