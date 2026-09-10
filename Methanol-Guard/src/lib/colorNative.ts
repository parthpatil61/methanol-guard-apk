import jpeg from 'jpeg-js';

export type RiskBand = 'safe' | 'suspicious' | 'high';

export interface ColorMetrics {
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  v: number;
  purpleIndex: number;
  luminance: number;
  contrast: number;
}

export interface AnalysisResult {
  metrics: ColorMetrics;
  quality: {
    lighting: 'ok' | 'dark' | 'bright';
    contrast: 'ok' | 'low';
    purpleSignal: 'ok' | 'weak' | 'strong';
    retakeSuggested: boolean;
    messages: string[];
  };
  riskScore: number;
  band: RiskBand;
  estimatedMgL: number;
  interpretation: string;
}

function rgbToHsv(
  r: number,
  g: number,
  b: number
) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;

  if (d !== 0) {
    if (max === rn) {
      h = ((gn - bn) / d) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }

    h *= 60;

    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return {
    h,
    s,
    v,
  };
}

function purpleHueWeight(h: number) {
  const center = 300;

  const dist = Math.min(
    Math.abs(h - center),
    360 - Math.abs(h - center)
  );

  return Math.max(
    0,
    1 - dist / 70
  );
}

function analyzePixels(
  pixels: Uint8Array,
  width: number,
  height: number,
  roiX = 0.5,
  roiY = 0.5
): ColorMetrics {

  /*
   * ROI position is supplied as normalized
   * coordinates from the camera preview.
   *
   * roiX:
   * 0 = left
   * 1 = right
   *
   * roiY:
   * 0 = top
   * 1 = bottom
   */

  const safeX = Math.min(
    1,
    Math.max(0, roiX)
  );

  const safeY = Math.min(
    1,
    Math.max(0, roiY)
  );

  const cx = width * safeX;
  const cy = height * safeY;

  /*
   * Same approximate ROI size as the
   * previous native implementation.
   */
  const radius =
    Math.min(width, height) * 0.18;

  const r2 = radius * radius;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  let lumSum = 0;
  let lumSq = 0;

  let n = 0;

  const minX = Math.max(
    0,
    Math.floor(cx - radius)
  );

  const maxX = Math.min(
    width,
    Math.ceil(cx + radius)
  );

  const minY = Math.max(
    0,
    Math.floor(cy - radius)
  );

  const maxY = Math.min(
    height,
    Math.ceil(cy + radius)
  );

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {

      const dx =
        x + 0.5 - cx;

      const dy =
        y + 0.5 - cy;

      if (
        dx * dx +
          dy * dy >
        r2
      ) {
        continue;
      }

      const index =
        (y * width + x) * 4;

      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];

      rSum += r;
      gSum += g;
      bSum += b;

      const lum =
        0.2126 * r +
        0.7152 * g +
        0.0722 * b;

      lumSum += lum;
      lumSq += lum * lum;

      n++;
    }
  }

  if (n === 0) {
    return {
      r: 0,
      g: 0,
      b: 0,
      h: 0,
      s: 0,
      v: 0,
      purpleIndex: 0,
      luminance: 0,
      contrast: 0,
    };
  }

  const r = rSum / n;
  const g = gSum / n;
  const b = bSum / n;

  const hsv = rgbToHsv(
    r,
    g,
    b
  );

  const luminance =
    lumSum / n;

  const variance = Math.max(
    0,
    lumSq / n -
      luminance * luminance
  );

  const contrast =
    Math.sqrt(variance);

  /*
   * Same purple-index formula as the
   * original web application.
   */
  const purpleIndex =
    purpleHueWeight(hsv.h) *
    hsv.s *
    (0.45 + 0.55 * hsv.v);

  return {
    r,
    g,
    b,
    h: hsv.h,
    s: hsv.s,
    v: hsv.v,
    purpleIndex,
    luminance,
    contrast,
  };
}

export function analyzeMetrics(
  metrics: ColorMetrics
): AnalysisResult {

  const messages: string[] = [];

  let lighting:
    'ok' |
    'dark' |
    'bright' = 'ok';

  if (metrics.luminance < 42) {
    lighting = 'dark';

    messages.push(
      'Image is too dark. Move to better light or turn on the flash.'
    );
  } else if (
    metrics.luminance > 232
  ) {
    lighting = 'bright';

    messages.push(
      'Image is overexposed. Avoid glare and direct flash bounce.'
    );
  }

  let contrast:
    'ok' |
    'low' = 'ok';

  if (metrics.contrast < 6) {
    contrast = 'low';

    messages.push(
      'Low texture in the sample zone. Refocus and fill the circle with the reaction pad.'
    );
  }

  let purpleSignal:
    'ok' |
    'weak' |
    'strong' = 'weak';

  if (
    metrics.purpleIndex > 0.18
  ) {
    purpleSignal = 'ok';
  }

  if (
    metrics.purpleIndex > 0.38
  ) {
    purpleSignal = 'strong';
  }

  const retakeSuggested =
    lighting !== 'ok' ||
    contrast === 'low';

  /*
   * DEMO CALIBRATION
   *
   * Preserved from the original prototype.
   * Replace with laboratory calibration data
   * before using quantitative concentration values.
   */
  const riskScore =
    Math.round(
      Math.min(
        100,
        Math.max(
          0,
          metrics.purpleIndex * 145
        )
      )
    );

  let band: RiskBand = 'safe';

  if (riskScore >= 61) {
    band = 'high';
  } else if (
    riskScore >= 21
  ) {
    band = 'suspicious';
  }

  const estimatedMgL =
    riskScore < 8
      ? 0
      : Math.round(
          (riskScore / 100) *
            1800
        );

  const interpretation =
    band === 'high'
      ? 'High suspicion of methanol. Flag this sample for confirmatory laboratory analysis (GC / GC-MS). Do not treat this result as legal proof.'
      : band === 'suspicious'
        ? 'Possible contamination. Repeat the strip if lighting was poor, then send a portion of the sample for laboratory confirmation.'
        : 'No strong purple chromotropic-acid signal in the sampled zone. This is a preliminary screen only — it does not prove the drink is safe.';

  return {
    metrics,

    quality: {
      lighting,
      contrast,
      purpleSignal,
      retakeSuggested,
      messages,
    },

    riskScore,
    band,
    estimatedMgL,
    interpretation,
  };
}

/*
 * Decode a JPEG camera image and analyze
 * the user-selected ROI.
 */
export function analyzeJpegBuffer(
  buffer: Uint8Array,
  roiX = 0.5,
  roiY = 0.5
): AnalysisResult {

  const decoded =
    jpeg.decode(
      buffer,
      {
        useTArray: true,
      }
    );

  const metrics =
    analyzePixels(
      decoded.data,
      decoded.width,
      decoded.height,
      roiX,
      roiY
    );

  return analyzeMetrics(
    metrics
  );
}