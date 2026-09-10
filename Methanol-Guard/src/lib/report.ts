import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { TestRecord } from './storage';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export async function generateTestReport(
  test: TestRecord
) {
  const result = test.result;

  const bandLabel =
    result.band === 'high'
      ? 'High risk'
      : result.band === 'suspicious'
        ? 'Suspicious'
        : 'Screening: low signal';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<style>
  body {
    font-family: Georgia, serif;
    background: #f7f1e6;
    color: #1c1915;
    padding: 32px;
  }

  h1 {
    color: #4a1236;
    margin-bottom: 4px;
  }

  h2 {
    color: #4a1236;
    margin-top: 26px;
    border-bottom: 1px solid #d8ceba;
    padding-bottom: 6px;
  }

  .subtitle {
    color: #5c564c;
    margin-bottom: 20px;
  }

  .warning {
    background: #efe4c8;
    border: 1px solid #d4c392;
    padding: 12px;
    margin-bottom: 20px;
    font-size: 12px;
    line-height: 1.5;
  }

  .card {
    background: #fffaf1;
    border: 1px solid #d8ceba;
    padding: 14px;
    margin-bottom: 12px;
  }

  .score {
    font-size: 34px;
    font-weight: bold;
    color: #6e1d52;
  }

  .band {
    font-size: 18px;
    font-weight: bold;
    color: #6e1d52;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  td {
    padding: 8px 4px;
    border-bottom: 1px solid #eee5d6;
    vertical-align: top;
  }

  td:first-child {
    color: #5c564c;
    width: 38%;
  }

  .footer {
    margin-top: 30px;
    color: #5c564c;
    font-size: 11px;
    line-height: 1.5;
  }
</style>
</head>

<body>

<h1>Methanol Guard</h1>

<div class="subtitle">
  Field screening report
</div>

<div class="warning">
  <strong>IMPORTANT:</strong>
  This is a preliminary colorimetric screening result only.
  It does not prove that a drink is safe, does not establish
  legal proof, and must not replace confirmatory laboratory
  analysis.
</div>

<div class="card">
  <table>
    <tr>
      <td>Date &amp; time</td>
      <td>${escapeHtml(formatDate(test.createdAt))}</td>
    </tr>

    <tr>
      <td>Inspector ID</td>
      <td>${escapeHtml(test.inspectorId || 'Not recorded')}</td>
    </tr>

    <tr>
      <td>Brand / source</td>
      <td>${escapeHtml(test.brand || 'Not recorded')}</td>
    </tr>

    <tr>
      <td>Batch / bottle ID</td>
      <td>${escapeHtml(test.batchId || 'Not recorded')}</td>
    </tr>

    <tr>
      <td>Place</td>
      <td>${escapeHtml(test.locationLabel || 'Not recorded')}</td>
    </tr>

    <tr>
      <td>GPS</td>
      <td>
        ${
          test.lat !== null && test.lng !== null
            ? `${test.lat.toFixed(6)}, ${test.lng.toFixed(6)}`
            : 'Not recorded'
        }
      </td>
    </tr>

    <tr>
      <td>Notes</td>
      <td>${escapeHtml(test.notes || 'None')}</td>
    </tr>
  </table>
</div>

<h2>Screening result</h2>

<div class="card">
  <div class="score">
    ${result.riskScore}/100
  </div>

  <div class="band">
    ${bandLabel}
  </div>
</div>

<div class="card">
  <strong>Demo estimate</strong>

  <p>
    ${result.estimatedMgL} mg/L
  </p>

  <p style="font-size:12px;color:#5c564c;">
    Prototype demo calibration only. Replace with a validated
    laboratory calibration curve before using quantitative values.
  </p>
</div>

<h2>Interpretation</h2>

<div class="card">
  ${escapeHtml(result.interpretation)}
</div>

<h2>Image quality</h2>

<div class="card">
  <table>

    <tr>
      <td>Lighting</td>
      <td>${escapeHtml(result.quality.lighting)}</td>
    </tr>

    <tr>
      <td>Contrast</td>
      <td>${escapeHtml(result.quality.contrast)}</td>
    </tr>

    <tr>
      <td>Purple signal</td>
      <td>${escapeHtml(result.quality.purpleSignal)}</td>
    </tr>

    <tr>
      <td>Retake suggested</td>
      <td>${result.quality.retakeSuggested ? 'Yes' : 'No'}</td>
    </tr>

  </table>
</div>

<h2>Color metrics</h2>

<div class="card">
  <table>

    <tr>
      <td>Red</td>
      <td>${result.metrics.r.toFixed(1)}</td>
    </tr>

    <tr>
      <td>Green</td>
      <td>${result.metrics.g.toFixed(1)}</td>
    </tr>

    <tr>
      <td>Blue</td>
      <td>${result.metrics.b.toFixed(1)}</td>
    </tr>

    <tr>
      <td>Hue</td>
      <td>${result.metrics.h.toFixed(1)}°</td>
    </tr>

    <tr>
      <td>Saturation</td>
      <td>${(result.metrics.s * 100).toFixed(1)}%</td>
    </tr>

    <tr>
      <td>Value</td>
      <td>${(result.metrics.v * 100).toFixed(1)}%</td>
    </tr>

    <tr>
      <td>Purple index</td>
      <td>${result.metrics.purpleIndex.toFixed(3)}</td>
    </tr>

    <tr>
      <td>Luminance</td>
      <td>${result.metrics.luminance.toFixed(1)}</td>
    </tr>

    <tr>
      <td>Contrast</td>
      <td>${result.metrics.contrast.toFixed(1)}</td>
    </tr>

  </table>
</div>

<div class="footer">
  Methanol Guard — Field screening companion.<br />
  Screening signals should be followed by appropriate
  confirmatory laboratory testing.
</div>

</body>
</html>
`;

  const { uri } = await Print.printToFileAsync({
    html,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Methanol Guard report',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
}