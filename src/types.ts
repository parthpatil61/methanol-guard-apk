export type RiskBand = 'safe' | 'suspicious' | 'high'

export type Screen =
  | 'home'
  | 'guide'
  | 'sample'
  | 'capture'
  | 'result'
  | 'history'
  | 'dashboard'

export interface ColorMetrics {
  r: number
  g: number
  b: number
  h: number
  s: number
  v: number
  purpleIndex: number
  luminance: number
  contrast: number
}

export interface QualityCheck {
  lighting: 'ok' | 'dark' | 'bright'
  contrast: 'ok' | 'low'
  purpleSignal: 'ok' | 'weak' | 'strong'
  retakeSuggested: boolean
  messages: string[]
}

export interface AnalysisResult {
  metrics: ColorMetrics
  quality: QualityCheck
  riskScore: number
  band: RiskBand
  estimatedMgL: number | null
  interpretation: string
}

export interface SampleInfo {
  inspectorId: string
  brand: string
  batchId: string
  notes: string
}

export interface TestRecord extends SampleInfo {
  id: string
  createdAt: string
  lat: number | null
  lng: number | null
  locationLabel: string
  imageDataUrl: string
  result: AnalysisResult
}
