import type { AnalysisResult, ColorMetrics, QualityCheck, RiskBand } from '../types'

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

/** How strongly the hue matches chromotropic-acid violet/purple (~270–330°). */
function purpleHueWeight(h: number) {
  const center = 300
  const dist = Math.min(Math.abs(h - center), 360 - Math.abs(h - center))
  return Math.max(0, 1 - dist / 70)
}

export function sampleRoi(
  image: HTMLImageElement | HTMLCanvasElement,
  cx: number,
  cy: number,
  radius: number,
): ColorMetrics {
  const canvas = document.createElement('canvas')
  const w = image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const h = image instanceof HTMLImageElement ? image.naturalHeight : image.height
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      r: 0, g: 0, b: 0, h: 0, s: 0, v: 0, purpleIndex: 0, luminance: 0, contrast: 0,
    }
  }
  ctx.drawImage(image, 0, 0)
  const size = Math.max(8, Math.round(radius * 2))
  const sx = Math.max(0, Math.round(cx - radius))
  const sy = Math.max(0, Math.round(cy - radius))
  const sw = Math.min(size, w - sx)
  const sh = Math.min(size, h - sy)
  const data = ctx.getImageData(sx, sy, sw, sh).data

  let rSum = 0
  let gSum = 0
  let bSum = 0
  let n = 0
  let lumSum = 0
  let lumSq = 0
  const r2 = radius * radius
  const ox = cx - sx
  const oy = cy - sy

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const dx = x + 0.5 - ox
      const dy = y + 0.5 - oy
      if (dx * dx + dy * dy > r2) continue
      const i = (y * sw + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      rSum += r
      gSum += g
      bSum += b
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      lumSum += lum
      lumSq += lum * lum
      n++
    }
  }

  if (n === 0) {
    return {
      r: 0, g: 0, b: 0, h: 0, s: 0, v: 0, purpleIndex: 0, luminance: 0, contrast: 0,
    }
  }

  const r = rSum / n
  const g = gSum / n
  const b = bSum / n
  const hsv = rgbToHsv(r, g, b)
  const luminance = lumSum / n
  const variance = Math.max(0, lumSq / n - luminance * luminance)
  const contrast = Math.sqrt(variance)
  const purpleIndex = purpleHueWeight(hsv.h) * hsv.s * (0.45 + 0.55 * hsv.v)

  return {
    r, g, b, h: hsv.h, s: hsv.s, v: hsv.v, purpleIndex, luminance, contrast,
  }
}

export function analyzeMetrics(metrics: ColorMetrics): AnalysisResult {
  const messages: string[] = []
  let lighting: QualityCheck['lighting'] = 'ok'
  if (metrics.luminance < 42) {
    lighting = 'dark'
    messages.push('Image is too dark. Move to better light or turn on the flash.')
  } else if (metrics.luminance > 232) {
    lighting = 'bright'
    messages.push('Image is overexposed. Avoid glare and direct flash bounce.')
  }

  let contrast: QualityCheck['contrast'] = 'ok'
  if (metrics.contrast < 6) {
    contrast = 'low'
    messages.push('Low texture in the sample zone. Refocus and fill the circle with the reaction pad.')
  }

  let purpleSignal: QualityCheck['purpleSignal'] = 'weak'
  if (metrics.purpleIndex > 0.18) purpleSignal = 'ok'
  if (metrics.purpleIndex > 0.38) purpleSignal = 'strong'

  const retakeSuggested = lighting !== 'ok' || contrast === 'low'

  // Demo calibration: purple index → risk. Replace with lab strip standards later.
  const riskScore = Math.round(Math.min(100, Math.max(0, metrics.purpleIndex * 145)))
  let band: RiskBand = 'safe'
  if (riskScore >= 61) band = 'high'
  else if (riskScore >= 21) band = 'suspicious'

  const estimatedMgL =
    riskScore < 8 ? 0 : Math.round((riskScore / 100) * 1800)

  const interpretation =
    band === 'high'
      ? 'High suspicion of methanol. Flag this sample for confirmatory laboratory analysis (GC / GC-MS). Do not treat this result as legal proof.'
      : band === 'suspicious'
        ? 'Possible contamination. Repeat the strip if lighting was poor, then send a portion of the sample for laboratory confirmation.'
        : 'No strong purple chromotropic-acid signal in the sampled zone. This is a preliminary screen only — it does not prove the drink is safe.'

  return {
    metrics,
    quality: { lighting, contrast, purpleSignal, retakeSuggested, messages },
    riskScore,
    band,
    estimatedMgL,
    interpretation,
  }
}

export function bandLabel(band: RiskBand) {
  if (band === 'high') return 'High risk'
  if (band === 'suspicious') return 'Suspicious'
  return 'Screening: low signal'
}

export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = dataUrl
  })
}
