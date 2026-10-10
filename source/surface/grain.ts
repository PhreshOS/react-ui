/**
 * Returns the tiled grain texture for one seed, density, and opacity. The
 * opacity is baked into the image so grain can share one layer with the paint
 * without also fading that layer's backdrop.
 *
 * It is a small PNG, not an SVG: a browser may draw an SVG background again
 * each time it paints, and WebKit does, so thousands of grain pixels across
 * every Surface made Safari spend tens of milliseconds on a frame.
 */
export function grainImage(seed: number, amount: number, opacity: number): string {
  const key = `${seed}:${amount}:${Math.round(opacity * 1_000)}`
  const cached = resources.get(key)
  if (cached !== undefined) return cached

  // Index 0 is a clear pixel; each tone after it is a grey at the grain's opacity.
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
  const palette = [[0, 0, 0, 0], ...Array.from({ length: toneCount }, (_, tone) => [channel(tone), channel(tone), channel(tone), alpha])]
  const resource = `url("data:image/png;base64,${indexedPng(patternSize, patternSize, palette, grainPixels(seed, amount))}")`

  // The same few textures repeat across every Surface; the bound keeps live
  // grain controls from growing the cache without limit.
  if (resources.size >= resourceLimit) resources.delete(resources.keys().next().value!)
  resources.set(key, resource)
  return resource
}

/**
 * One grain texture as a shared class. Its name comes from the texture's own
 * parameters, so server and browser rendering agree on it, and the rule is
 * written once however many Surfaces use it instead of inline on each.
 */
export function grainTexture(seed: number, amount: number, opacity: number): Readonly<{ name: string, rule: string }> {
  const name = `phreshos-grain-${seed}-${amount}-${Math.round(opacity * 1_000)}`.replace(/[^a-z0-9-]/gi, "_")
  return { name, rule: `:where(.${name}) { --phreshos-surface-grain: ${grainImage(seed, amount, opacity)} }` }
}

/**
 * One texture serves every Surface. Each Surface tiles it from its own origin,
 * so neighbours never align, and equal paints can share one generated class.
 */
export const grainSeed = 47

export const grainSize = 64

/** `amount` is the monotonic density of visible grain pixels: each pixel's palette index, 0 where clear. */
function grainPixels(seed: number, amount: number) {
  const pixels = new Uint8Array(patternSize * patternSize)

  for (let y = 0; y < patternSize; y += 1) {
    for (let x = 0; x < patternSize; x += 1) {
      const pointX = x + seed * 41
      const pointY = y + seed * 17
      if (hash(pointX + 71.9, pointY + 13.7) > amount) continue

      const fine = hash(Math.floor(pointX * 1.18), Math.floor(pointY * 1.18))
      const clustered = hash(Math.floor(pointX * 0.47) + 31.7, Math.floor(pointY * 0.47) + 31.7)
      const value = Math.min(1, Math.max(0, fine * 0.8 + clustered * 0.2))
      pixels[y * patternSize + x] = 1 + Math.min(toneCount - 1, Math.floor(value * toneCount))
    }
  }

  return pixels
}

/**
 * An 8-bit indexed PNG, base64, with each palette entry's alpha. The image is
 * small, so its data is stored uncompressed: no compressor, the same bytes on
 * a server and in a browser.
 */
function indexedPng(width: number, height: number, palette: readonly (readonly number[])[], pixels: Uint8Array) {
  const rows = new Uint8Array(height * (width + 1))
  for (let y = 0; y < height; y += 1) rows.set(pixels.subarray(y * width, (y + 1) * width), y * (width + 1) + 1)

  const header = new Uint8Array(13)
  const view = new DataView(header.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  header.set([8, 3, 0, 0, 0], 8)

  const bytes = concat([
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    chunk("IHDR", header),
    chunk("PLTE", Uint8Array.from(palette.flatMap(([red, green, blue]) => [red!, green!, blue!]))),
    chunk("tRNS", Uint8Array.from(palette.map(entry => entry[3]!))),
    chunk("IDAT", storedZlib(rows)),
    chunk("IEND", new Uint8Array(0))
  ])

  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function chunk(type: string, data: Uint8Array) {
  const body = concat([Uint8Array.from(type, letter => letter.charCodeAt(0)), data])
  const out = new Uint8Array(body.length + 8)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(body, 4)
  view.setUint32(body.length + 4, crc32(body))
  return out
}

/** A zlib stream of stored (uncompressed) deflate blocks. */
function storedZlib(data: Uint8Array) {
  const blocks: Uint8Array[] = [Uint8Array.of(0x78, 0x01)]
  for (let offset = 0; offset < data.length || offset === 0; offset += 65_535) {
    const part = data.subarray(offset, offset + 65_535)
    const last = offset + 65_535 >= data.length ? 1 : 0
    blocks.push(Uint8Array.of(last, part.length & 0xff, part.length >> 8, ~part.length & 0xff, (~part.length >> 8) & 0xff), part)
  }
  let a = 1, b = 0
  for (const byte of data) { a = (a + byte) % 65_521; b = (b + a) % 65_521 }
  const checksum = new Uint8Array(4)
  new DataView(checksum.buffer).setUint32(0, ((b << 16) | a) >>> 0)
  blocks.push(checksum)
  return concat(blocks)
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

function concat(parts: readonly Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) { out.set(part, offset); offset += part.length }
  return out
}

function channel(tone: number) {
  return Math.round(tone / (toneCount - 1) * 255)
}

function hash(x: number, y: number) {
  let red = fract(x * 0.1031)
  let green = fract(y * 0.1031)
  let blue = fract(x * 0.1031)
  const product = red * (green + 33.33) + green * (blue + 33.33) + blue * (red + 33.33)
  red += product
  green += product
  blue += product
  return fract((red + green) * blue)
}

function fract(value: number) {
  return value - Math.floor(value)
}

const patternSize = grainSize
const toneCount = 16
const resourceLimit = 64
const resources = new Map<string, string>()
