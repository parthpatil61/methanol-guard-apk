import { bandLabel } from './color'
import type { TestRecord } from '../types'

export function openPrintableReport(record: TestRecord) {
  const m = record.result.metrics
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Methanol Guard screening report ${record.id}</title>
  <style>
    body { font-family: Georgia, serif; color: #1c1915; margin: 32px; max-width: 720px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #5c564c; font-size: 13px; }
    .banner { background: #f3ead2; border: 1px solid #c9b57a; padding: 10px 12px; margin: 16px 0; font-size: 13px; }
    img { max-width: 100%; border: 1px solid #d8d0c0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e6dfd2; vertical-align: top; }
    td:first-child { width: 180px; color: #5c564c; }
    .score { font-size: 28px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Methanol Guard — field screening report</h1>
  <p class="muted">Preliminary colorimetric screen only. Not a laboratory confirmation and not legal evidence of methanol content.</p>
  <div class="banner">If risk is suspicious or high, send the sample for GC / GC-MS confirmation. This strip uses a chromotropic-acid style purple response as a research prototype.</div>
  <p class="score">${record.result.riskScore} / 100 — ${bandLabel(record.result.band)}</p>
  <img src="${record.imageDataUrl}" alt="Strip photograph" />
  <table>
    <tr><td>Test ID</td><td>${record.id}</td></tr>
    <tr><td>Date / time</td><td>${new Date(record.createdAt).toLocaleString()}</td></tr>
    <tr><td>Inspector ID</td><td>${escapeHtml(record.inspectorId || '—')}</td></tr>
    <tr><td>Brand / source</td><td>${escapeHtml(record.brand || '—')}</td></tr>
    <tr><td>Batch ID</td><td>${escapeHtml(record.batchId || '—')}</td></tr>
    <tr><td>Location</td><td>${escapeHtml(record.locationLabel || '—')}</td></tr>
    <tr><td>GPS</td><td>${record.lat != null && record.lng != null ? `${record.lat.toFixed(5)}, ${record.lng.toFixed(5)}` : 'Not recorded'}</td></tr>
    <tr><td>RGB</td><td>${m.r.toFixed(0)}, ${m.g.toFixed(0)}, ${m.b.toFixed(0)}</td></tr>
    <tr><td>HSV</td><td>${m.h.toFixed(0)}°, ${(m.s * 100).toFixed(0)}%, ${(m.v * 100).toFixed(0)}%</td></tr>
    <tr><td>Purple index</td><td>${m.purpleIndex.toFixed(3)}</td></tr>
    <tr><td>Est. methanol (demo)</td><td>${record.result.estimatedMgL ?? '—'} mg/L (uncalibrated placeholder)</td></tr>
    <tr><td>Interpretation</td><td>${escapeHtml(record.result.interpretation)}</td></tr>
    <tr><td>Notes</td><td>${escapeHtml(record.notes || '—')}</td></tr>
  </table>
  <p class="muted">Maharashtra FDA complaints: https://complaints.mahafda.in/</p>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
