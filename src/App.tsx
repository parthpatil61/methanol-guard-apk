import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeMetrics, bandLabel, loadImage, sampleRoi } from './lib/color'
import { openPrintableReport } from './lib/report'
import { deleteTest, loadTests, saveTest } from './lib/storage'
import type { AnalysisResult, SampleInfo, Screen, TestRecord } from './types'
import './App.css'

const FDA_URL = 'https://complaints.mahafda.in/'
const emptySample: SampleInfo = {
  inspectorId: '',
  brand: '',
  batchId: '',
  notes: '',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [sample, setSample] = useState<SampleInfo>(emptySample)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [records, setRecords] = useState<TestRecord[]>(() => loadTests())
  const [savedId, setSavedId] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')

  const currentRecord = useMemo(() => {
    if (!imageDataUrl || !result) return null
    const rec: TestRecord = {
      id: savedId ?? `MG-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      locationLabel,
      imageDataUrl,
      result,
      ...sample,
    }
    return rec
  }, [coords, imageDataUrl, locationLabel, result, sample, savedId])

  function refreshHistory() {
    setRecords(loadTests())
  }

  function startNewTest() {
    setSample(emptySample)
    setImageDataUrl(null)
    setResult(null)
    setSavedId(null)
    setScreen('guide')
  }

  return (
    <div className="shell">
      <header className="top">
        <button type="button" className="brand" onClick={() => setScreen('home')}>
          <span className="mark" aria-hidden />
          Methanol Guard
        </button>
        <p className="tag">Field screening companion</p>
      </header>

      <div className="disclaimer">
        Screening tool only — purple color is a preliminary chromotropic-acid style signal. Confirm with a laboratory. Not medical or legal advice.
      </div>

      <main>
        {screen === 'home' && (
          <Home
            count={records.length}
            high={records.filter((r) => r.result.band === 'high').length}
            onStart={startNewTest}
            onHistory={() => {
              refreshHistory()
              setScreen('history')
            }}
            onDashboard={() => {
              refreshHistory()
              setScreen('dashboard')
            }}
          />
        )}
        {screen === 'guide' && (
          <Guide onNext={() => setScreen('sample')} onBack={() => setScreen('home')} />
        )}
        {screen === 'sample' && (
          <SampleForm
            sample={sample}
            locationLabel={locationLabel}
            hasGps={Boolean(coords)}
            onChange={setSample}
            onLocationLabel={setLocationLabel}
            onGps={setCoords}
            onNext={() => setScreen('capture')}
            onBack={() => setScreen('guide')}
          />
        )}
        {screen === 'capture' && (
          <Capture
            initialImage={imageDataUrl}
            onBack={() => setScreen('sample')}
            onAnalyzed={(img, analysis) => {
              setImageDataUrl(img)
              setResult(analysis)
              setSavedId(null)
              setScreen('result')
            }}
          />
        )}
        {screen === 'result' && result && imageDataUrl && currentRecord && (
          <ResultView
            record={currentRecord}
            alreadySaved={Boolean(savedId)}
            onRetake={() => setScreen('capture')}
            onSave={() => {
              saveTest(currentRecord)
              setSavedId(currentRecord.id)
              refreshHistory()
            }}
            onReport={() => openPrintableReport(currentRecord)}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'history' && (
          <History
            records={records}
            onBack={() => setScreen('home')}
            onOpen={(rec) => {
              setSample({
                inspectorId: rec.inspectorId,
                brand: rec.brand,
                batchId: rec.batchId,
                notes: rec.notes,
              })
              setImageDataUrl(rec.imageDataUrl)
              setResult(rec.result)
              setSavedId(rec.id)
              setCoords(rec.lat != null && rec.lng != null ? { lat: rec.lat, lng: rec.lng } : null)
              setLocationLabel(rec.locationLabel)
              setScreen('result')
            }}
            onDelete={(id) => {
              deleteTest(id)
              refreshHistory()
            }}
          />
        )}
        {screen === 'dashboard' && (
          <Dashboard records={records} onBack={() => setScreen('home')} />
        )}
      </main>
    </div>
  )
}

function Home({
  count,
  high,
  onStart,
  onHistory,
  onDashboard,
}: {
  count: number
  high: number
  onStart: () => void
  onHistory: () => void
  onDashboard: () => void
}) {
  return (
    <section className="stack">
      <h1>Instant strip screening for suspected methanol in alcohol</h1>
      <p className="lede">
        Photograph a paper colorimetric strip, measure the violet reaction zone, and log a field
        record for inspectors. Built for Aviskar as a companion to a chromotropic-acid paper strip.
      </p>
      <div className="stats">
        <div>
          <strong>{count}</strong>
          <span>saved tests</span>
        </div>
        <div>
          <strong>{high}</strong>
          <span>high-risk flags</span>
        </div>
      </div>
      <button type="button" className="primary" onClick={onStart}>
        Start new screen
      </button>
      <div className="row">
        <button type="button" className="ghost" onClick={onHistory}>
          Test history
        </button>
        <button type="button" className="ghost" onClick={onDashboard}>
          Dashboard
        </button>
      </div>
      <ol className="steps">
        <li>Apply sample to the strip and wait the kit time.</li>
        <li>Photograph the reaction pad in even light.</li>
        <li>Place the circle on the purple (or blank) zone.</li>
        <li>Save GPS + batch notes. High risk → lab confirmation.</li>
      </ol>
      <a className="fda" href={FDA_URL} target="_blank" rel="noreferrer">
        Maharashtra FDA complaint portal
      </a>
    </section>
  )
}

function Guide({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <section className="stack">
      <h1>How to run the strip</h1>
      <ol className="guide-list">
        <li>
          <strong>Collect a small sample</strong>
          Use under 50 µL. Do not taste or ingest the drink during testing.
        </li>
        <li>
          <strong>Apply to the sensing zone</strong>
          Methanol is oxidized to formaldehyde, then chromotropic acid can form a violet complex.
        </li>
        <li>
          <strong>Wait the kit time</strong>
          Typical paper assays develop in a few minutes. Do not read a wet, dripping pad.
        </li>
        <li>
          <strong>Photograph</strong>
          Hold the phone parallel to the strip. Avoid shadows and colored ambient light.
        </li>
        <li>
          <strong>Interpret</strong>
          No purple → low signal. Purple/violet → suspicious or high risk. Always confirm positives in a lab.
        </li>
      </ol>
      <div className="row">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Enter sample details
        </button>
      </div>
    </section>
  )
}

function SampleForm({
  sample,
  locationLabel,
  hasGps,
  onChange,
  onLocationLabel,
  onGps,
  onNext,
  onBack,
}: {
  sample: SampleInfo
  locationLabel: string
  hasGps: boolean
  onChange: (s: SampleInfo) => void
  onLocationLabel: (s: string) => void
  onGps: (c: { lat: number; lng: number } | null) => void
  onNext: () => void
  onBack: () => void
}) {
  const [gpsMsg, setGpsMsg] = useState('')

  function requestGps() {
    if (!navigator.geolocation) {
      setGpsMsg('Geolocation is not available in this browser.')
      return
    }
    setGpsMsg('Requesting location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsMsg('GPS saved with this test.')
      },
      () => setGpsMsg('Location permission denied or unavailable.'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <section className="stack">
      <h1>Sample documentation</h1>
      <label>
        Inspector ID
        <input
          value={sample.inspectorId}
          onChange={(e) => onChange({ ...sample, inspectorId: e.target.value })}
          placeholder="e.g. EXC-104"
        />
      </label>
      <label>
        Brand / source
        <input
          value={sample.brand}
          onChange={(e) => onChange({ ...sample, brand: e.target.value })}
          placeholder="Seized brand, vendor, or unmarked"
        />
      </label>
      <label>
        Batch / bottle ID
        <input
          value={sample.batchId}
          onChange={(e) => onChange({ ...sample, batchId: e.target.value })}
          placeholder="Label, seal, or exhibit number"
        />
      </label>
      <label>
        Place name
        <input
          value={locationLabel}
          onChange={(e) => onLocationLabel(e.target.value)}
          placeholder="Warehouse, checkpoint, village"
        />
      </label>
      <label>
        Notes
        <textarea
          rows={3}
          value={sample.notes}
          onChange={(e) => onChange({ ...sample, notes: e.target.value })}
          placeholder="Odour, packaging, number of bottles…"
        />
      </label>
      <button type="button" className="ghost" onClick={requestGps}>
        {hasGps ? 'GPS recorded' : 'Record GPS'}
      </button>
      {gpsMsg && <p className="hint">{gpsMsg}</p>}
      <div className="row">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Photograph strip
        </button>
      </div>
    </section>
  )
}

function Capture({
  initialImage,
  onBack,
  onAnalyzed,
}: {
  initialImage: string | null
  onBack: () => void
  onAnalyzed: (image: string, result: AnalysisResult) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [streamOn, setStreamOn] = useState(false)
  const [preview, setPreview] = useState<string | null>(initialImage)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [roi, setRoi] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    const stream = videoRef.current?.srcObject
    if (stream instanceof MediaStream) {
      for (const t of stream.getTracks()) t.stop()
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setStreamOn(false)
  }

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStreamOn(true)
      }
    } catch {
      setError('Camera permission denied. You can upload a photo instead.')
    }
  }

  function snap() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    setPreview(canvas.toDataURL('image/jpeg', 0.92))
    stopCamera()
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  function onPointer(e: React.PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    setRoi({
      x: Math.min(0.92, Math.max(0.08, (e.clientX - box.left) / box.width)),
      y: Math.min(0.92, Math.max(0.08, (e.clientY - box.top) / box.height)),
    })
  }

  async function runAnalysis() {
    if (!preview) return
    setBusy(true)
    setError('')
    try {
      const img = await loadImage(preview)
      const radius = Math.min(img.naturalWidth, img.naturalHeight) * 0.08
      const metrics = sampleRoi(img, roi.x * img.naturalWidth, roi.y * img.naturalHeight, radius)
      onAnalyzed(preview, analyzeMetrics(metrics))
    } catch {
      setError('Could not analyze this image.')
    } finally {
      setBusy(false)
    }
  }

  function makePractice(intensity: number) {
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#cbb892'
    ctx.fillRect(0, 0, 720, 480)
    ctx.fillStyle = '#efe6d4'
    ctx.fillRect(180, 80, 360, 320)
    ctx.fillStyle = `rgba(118, 28, 92, ${0.12 + intensity * 0.88})`
    ctx.beginPath()
    ctx.arc(360, 240, 90, 0, Math.PI * 2)
    ctx.fill()
    const g = ctx.createRadialGradient(360, 240, 8, 360, 240, 120)
    g.addColorStop(0, `rgba(92, 12, 70, ${0.2 + intensity * 0.8})`)
    g.addColorStop(1, 'rgba(239, 230, 212, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(360, 240, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#8a7a5c'
    ctx.strokeRect(180.5, 80.5, 359, 319)
    ctx.fillStyle = '#5c5346'
    ctx.font = '14px sans-serif'
    ctx.fillText('Practice pad — not a real assay', 200, 390)
    setPreview(canvas.toDataURL('image/png'))
    setRoi({ x: 0.5, y: 0.5 })
    stopCamera()
  }

  return (
    <section className="stack">
      <h1>Capture the reaction zone</h1>
      <p className="lede">Tap the photo to move the sampling circle onto the pad.</p>

      <video ref={videoRef} className={streamOn ? 'video' : 'hidden'} playsInline muted />
      {streamOn && (
        <button type="button" className="primary" onClick={snap}>
          Capture frame
        </button>
      )}

      {preview && !streamOn && (
        <div className="frame" onPointerDown={onPointer}>
          <img src={preview} alt="Strip preview" />
          <span
            className="roi"
            style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%` }}
          />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="row wrap">
        {!streamOn && (
          <button type="button" className="ghost" onClick={startCamera}>
            Open camera
          </button>
        )}
        <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
          Upload photo
        </button>
        <button type="button" className="ghost" onClick={() => makePractice(0.15)}>
          Practice: blank
        </button>
        <button type="button" className="ghost" onClick={() => makePractice(0.85)}>
          Practice: purple
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="row">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" disabled={!preview || busy} onClick={runAnalysis}>
          {busy ? 'Analyzing…' : 'Analyze color'}
        </button>
      </div>
    </section>
  )
}

function ResultView({
  record,
  alreadySaved,
  onRetake,
  onSave,
  onReport,
  onHome,
}: {
  record: TestRecord
  alreadySaved: boolean
  onRetake: () => void
  onSave: () => void
  onReport: () => void
  onHome: () => void
}) {
  const { result } = record
  return (
    <section className="stack">
      <h1>Screening result</h1>
      <div className={`score-card ${result.band}`}>
        <p className="score-num">{result.riskScore}</p>
        <p>Methanol risk score · {bandLabel(result.band)}</p>
        <p className="est">
          Demo estimate: {result.estimatedMgL} mg/L
          <span> (replace with lab calibration curve)</span>
        </p>
      </div>
      <p>{result.interpretation}</p>
      {result.quality.messages.map((m) => (
        <p key={m} className="warn">
          {m}
        </p>
      ))}
      <img className="result-img" src={record.imageDataUrl} alt="Analyzed strip" />
      <dl className="meta">
        <dt>RGB</dt>
        <dd>
          {result.metrics.r.toFixed(0)}, {result.metrics.g.toFixed(0)}, {result.metrics.b.toFixed(0)}
        </dd>
        <dt>HSV</dt>
        <dd>
          {result.metrics.h.toFixed(0)}° · {(result.metrics.s * 100).toFixed(0)}% ·{' '}
          {(result.metrics.v * 100).toFixed(0)}%
        </dd>
        <dt>Purple index</dt>
        <dd>{result.metrics.purpleIndex.toFixed(3)}</dd>
        <dt>GPS</dt>
        <dd>
          {record.lat != null && record.lng != null
            ? `${record.lat.toFixed(5)}, ${record.lng.toFixed(5)}`
            : 'Not recorded'}
        </dd>
      </dl>
      <div className="row wrap">
        <button type="button" className="ghost" onClick={onRetake}>
          Retake
        </button>
        <button type="button" className="primary" onClick={onSave} disabled={alreadySaved}>
          {alreadySaved ? 'Saved on this device' : 'Save locally'}
        </button>
        <button type="button" className="ghost" onClick={onReport}>
          Print / PDF report
        </button>
      </div>
      {result.band !== 'safe' && (
        <a className="fda" href={FDA_URL} target="_blank" rel="noreferrer">
          Open FDA complaint portal with this report nearby
        </a>
      )}
      <button type="button" className="ghost" onClick={onHome}>
        Home
      </button>
    </section>
  )
}

function History({
  records,
  onBack,
  onOpen,
  onDelete,
}: {
  records: TestRecord[]
  onBack: () => void
  onOpen: (r: TestRecord) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="stack">
      <h1>Test history</h1>
      {records.length === 0 && <p className="lede">No saved screens yet.</p>}
      <ul className="history">
        {records.map((r) => (
          <li key={r.id}>
            <button type="button" className="hist-btn" onClick={() => onOpen(r)}>
              <img src={r.imageDataUrl} alt="" />
              <span>
                <strong>
                  {r.result.riskScore} · {bandLabel(r.result.band)}
                </strong>
                <em>
                  {r.brand || 'Unlabelled'} · {new Date(r.createdAt).toLocaleString()}
                </em>
              </span>
            </button>
            <button type="button" className="tiny" onClick={() => onDelete(r.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="ghost" onClick={onBack}>
        Back
      </button>
    </section>
  )
}

function Dashboard({ records, onBack }: { records: TestRecord[]; onBack: () => void }) {
  const high = records.filter((r) => r.result.band === 'high').length
  const suspicious = records.filter((r) => r.result.band === 'suspicious').length
  const safe = records.filter((r) => r.result.band === 'safe').length
  const byPlace = new Map<string, number>()
  for (const r of records) {
    const key = r.locationLabel.trim() || 'Unspecified place'
    byPlace.set(key, (byPlace.get(key) ?? 0) + (r.result.band === 'safe' ? 0 : 1))
  }
  const places = [...byPlace.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <section className="stack">
      <h1>Local surveillance snapshot</h1>
      <p className="lede">Counts stay on this device. No cloud sync in this prototype.</p>
      <div className="stats three">
        <div>
          <strong>{safe}</strong>
          <span>low signal</span>
        </div>
        <div>
          <strong>{suspicious}</strong>
          <span>suspicious</span>
        </div>
        <div>
          <strong>{high}</strong>
          <span>high risk</span>
        </div>
      </div>
      <h2>Flagged tests by place</h2>
      {places.length === 0 && <p>No location labels yet.</p>}
      <ul className="places">
        {places.map(([name, n]) => (
          <li key={name}>
            <span>{name}</span>
            <b>{n}</b>
          </li>
        ))}
      </ul>
      <button type="button" className="ghost" onClick={onBack}>
        Back
      </button>
    </section>
  )
}
