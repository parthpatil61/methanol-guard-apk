# Methanol Guard

Companion web app for a paper-based chromotropic-acid methanol screening strip (Aviskar). It is a **preliminary field screen**, not a laboratory assay and not medical or legal proof.

## What it does

- Guided strip workflow
- Camera or photo upload of the reaction pad
- RGB / HSV sampling of a user-placed circle
- Risk score: 0–20 low signal, 21–60 suspicious, 61–100 high risk
- Sample notes, optional GPS, local history, printable report
- Link to the [Maharashtra FDA complaint portal](https://complaints.mahafda.in/)

The purple-index → mg/L mapping is a **placeholder** until you fit a curve from spiked ethanol standards on real strips.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Use **Practice: blank** and **Practice: purple** if you do not have a strip yet.

## Safety

Handle oxidizers and strong acid chemistry only under lab supervision. Positive or suspicious screens should go to GC / GC-MS confirmation.
