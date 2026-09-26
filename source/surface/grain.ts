/**
 * Returns the tiled grain texture for one seed, density, and opacity. The
 * opacity is baked into the image so grain can share one layer with the paint
 * without also fading that layer's backdrop.
 */
export function grainImage(seed: number, amount: number, opacity: number): string {
  const key = `${seed}:${amount}:${Math.round(opacity * 1_000)}`
  const cached = resources.get(key)
  if (cached !== undefined) return cached

  const paths = grainPaths(seed, amount)
    .map((path, tone) => path ? `<path d="${path}" fill="rgb(${channel(tone)} ${channel(tone)} ${channel(tone)})"/>` : "")
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}" viewBox="0 0 ${patternSize} ${patternSize}"><g opacity="${opacity}">${paths}</g></svg>`
  const resource = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

  // The same few textures repeat across every Surface; the bound keeps live
  // grain controls from growing the cache without limit.
  if (resources.size >= resourceLimit) resources.delete(resources.keys().next().value!)
  resources.set(key, resource)
  return resource
}

/**
 * One texture serves every Surface. Each Surface tiles it from its own origin,
 * so neighbours never align, and equal paints can share one generated class.
 */
export const grainSeed = 47

export const grainSize = 64

/** `amount` is the monotonic density of visible grain pixels. */
function grainPaths(seed: number, amount: number) {
  const tones = Array.from({ length: toneCount }, () => [] as string[])

  for (let y = 0; y < patternSize; y += 1) {
    for (let x = 0; x < patternSize; x += 1) {
      const pointX = x + seed * 41
      const pointY = y + seed * 17
      if (hash(pointX + 71.9, pointY + 13.7) > amount) continue

      const fine = hash(Math.floor(pointX * 1.18), Math.floor(pointY * 1.18))
      const clustered = hash(Math.floor(pointX * 0.47) + 31.7, Math.floor(pointY * 0.47) + 31.7)
      const value = Math.min(1, Math.max(0, fine * 0.8 + clustered * 0.2))
      tones[Math.min(toneCount - 1, Math.floor(value * toneCount))]?.push(`M${x} ${y}h1v1h-1z`)
    }
  }

  return tones.map(tone => tone.join(""))
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
