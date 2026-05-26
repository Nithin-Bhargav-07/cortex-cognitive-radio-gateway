<div align="center">

#  CORTEX
### The Cognitive Radio Gateway for Formula 1

*The pit wall sees the machine clearly. CORTEX protects the mind operating it.*

[![IBM Granite](https://img.shields.io/badge/IBM-Granite_4-052FAD?logo=ibm)](https://www.ibm.com/granite)
[![IBM Docling](https://img.shields.io/badge/IBM-Docling-052FAD?logo=ibm)](https://www.docling.ai)
[![IBM watsonx](https://img.shields.io/badge/IBM-watsonx.ai-052FAD?logo=ibm)](https://www.ibm.com/watsonx)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**IBM SkillsBuild AI Builders Challenge 2026 · Racing Innovation**

</div>

---

> **CORTEX is not a telemetry dashboard. It is not a strategy copilot.**
> It is a real-time cognitive radio gateway for Formula 1 —
> an AI system that decides when, how, and whether a message
> reaches the driver's conscious mind.

---

## The Problem

Formula 1 teams measure the car in extraordinary detail.
Tyre pressure. Brake temperature. Fuel flow. ERS deployment.
Millisecond precision across thousands of channels.

**The most consequential variable on track sits unmeasured:
whether the driver can actually process what the engineer is saying.**

At 5G lateral load through a hairpin at 200mph, the human brain
experiences a measurable neurological phenomenon called **fP3 suppression** —
auditory processing degrades. The driver physically cannot hear
complex instructions the way they would on a straight.

Every missed radio message is a strategy failure.
Every poorly timed instruction is a potential safety event.
No current motorsport AI system addresses this.
**The category is open.**

---

## The Solution

CORTEX monitors live telemetry to calculate driver cognitive load
every 100ms, then acts as an intelligent gateway for all pit wall
radio communications — buffering non-critical messages during
high-load moments and releasing concise AI-summarized versions
only when the driver has cognitive bandwidth to receive them.

Engineer speaks → CORTEX intercepts → IBM Granite classifies urgency
↓
CL score > 70?  ──YES──→  Buffer message (predictive or reactive hold)
↓ NO                         ↓
Deliver immediately        CL drops below 70
↓
Release 3-word Granite summary
+ Kokoro TTS audio to driver
+ Guardian safety validation
+ Audit log entry

### The key distinction: Predictive, not Reactive

Most systems react when the driver is already overloaded.

**CORTEX acts 3 seconds before they get there.**

IBM Docling parses official FIA Event Notes PDFs and extracts
corner G-force profiles for the circuit. When telemetry shows
the car approaching Turn 8 (4.5G, Monaco) — before the braking
even begins — CORTEX triggers a predictive hold. The engineer's
message is intercepted before the cognitive spike, not during it.

| Without CORTEX | With CORTEX |
|----------------|--------------|
| Engineer speaks mid-corner | Message intercepted 3s before corner |
| Driver experiences fP3 suppression | Driver in low-load zone when message arrives |
| Message missed or misunderstood | 3-word Granite summary, perfectly timed |
| No record of what was communicated | Full audit log: input, urgency, Guardian check |

---

## IBM AI Integration

| Tool | Role | Where |
|------|------|--------|
| **IBM Granite 4** | Urgency classification (1-3) + message summarization to 3 words | `granite_client.py` |
| **IBM Granite Guardian** | Safety validation — prevents hallucinated instructions reaching the driver | `granite_client.py` |
| **IBM Docling** | Parses FIA Event Notes PDF → extracts corner load profiles → powers predictive buffer | `docling_processor.py` |

### IBM Granite — Urgency Classification

Every radio message is classified by IBM Granite 4 via watsonx.ai:

- **Urgency 1** — Routine (gap info, position updates) → buffer during high load
- **Urgency 2** — Strategic (pit window, engine map) → buffer during high load  
- **Urgency 3** — Safety/Immediate (yellow flag, box box, debris) → bypass always

Granite also summarizes verbose engineer messages into 3 words
for cognitive-efficient delivery on the straight.

### IBM Docling — Predictive Corner Intelligence

Standard RAG systems destroy the table structure in FIA PDFs.
Docling's Vision-Language architecture preserves the exact
hierarchical tables mapping corners to G-force classifications.

FIA Event Notes PDF → IBM Docling → DocTags (structured)
↓
Corner load map: Turn 8 = 4.5G HIGH, Tunnel = 0G OPEN
↓
Predictive buffer armed 3 seconds before each high-load zone

### IBM Granite Guardian — Safety Validation

Every AI-generated summary passes through Guardian before
delivery. If Guardian detects semantic inversion
(e.g., "Do NOT box" summarized as "Box now"), the summary
is blocked and the original message delivered unmodified.

---

## Architecture

```
Monaco Synthetic Telemetry (10Hz)
            |
            v
+----------------------------------+
|     Cognitive Load Engine        |
|  brake(40%) + speed(25%) +       |
|  G-proxy(25%) + gear(10%)        |
|  + Docling 3s predictive layer   |
+----------------------------------+
            |
            v
+----------------------------------+
|       FastAPI Backend            |
|  /ws/telemetry  (10Hz stream)    |
|  /ws/radio      (event-driven)   |
|  /api/radio/submit               |
|  /api/radio/force                |
|  /api/health                     |
+----------------------------------+
            |
            v
+----------------------------------+
|       IBM AI Pipeline            |
|  Granite 4  -> urgency + summary |
|  Guardian   -> safety check      |
|  Kokoro TTS -> audio output      |
|  Audit log  -> written first     |
+----------------------------------+
            |
            v
+----------------------------------+
|       React Dashboard            |
|  View 1: CORTEX Command         |
|  View 2: Lap Intelligence        |
|  View 3: Car Systems             |
+----------------------------------+
```

---

## Dashboard

### View 1 — CORTEX Command
The flagship view for the Race Engineer.

- **Cognitive Load Hero** — live 0-100 score, color-reactive, with 6-second history heatmap
- **IBM Pipeline Log** — live terminal showing every AI decision as it happens
- **Docling Circuit Intelligence** — corner load map from FIA PDF, active rows highlight as car approaches
- **Predictive Hold Badge** — amber warning 3 seconds before high-load corners (Docling-powered)
- **Radio Decision Panel** — INTERCEPTED/RELEASED states with Granite urgency + Guardian result
- **Biometric Sparklines** — synthetic HRV and EDA derived from telemetry
- **Audit Log** — immutable session record of every radio decision before broadcast
- **Battle Proximity** — gap ahead/behind with DRS range detection

### View 2 — Lap Intelligence
Built for the Performance Engineer.

- Speed profile anchored to lap distance (not time)
- Throttle vs brake overlay — two separate 1px lines, no fill
- Gear selection step chart
- Steering angle trace with understeer detection
- Friction circle G-force scatter plot
- Sector deltas vs best lap

### View 3 — Car Systems
Built for the Systems Engineer.

- Tyre states — 4-corner grid (FL/FR/RL/RR) with surface temps and life %
- Brake thermals — 4-corner grid with BELOW WINDOW / OPTIMAL / OVERHEATING status
- Power unit — fuel, ERS SoC, MGU-K deploy/harvest as compact bars
- Suspension travel — FL/FR/RL/RR mm with directional mini bars
- Engine and gearbox temperatures with status thresholds

---

## Security

Every radio decision is logged before it is broadcast.
If the audit write fails, the event is not emitted.

- **Audit before broadcast** — every Granite classification, Guardian check,
  and buffer decision is written to session audit log before the WebSocket emit
- **Safety bypass hardcoded** — keywords (Safety Car, Red Flag, Box Box, Fire, Debris)
  bypass all AI logic with zero latency. Safety overrides AI, always.
- **Fail-open architecture** — if any AI component goes down, all radio
  traffic passes through unfiltered. The driver is never silenced by a system failure.
- **Guardian validation** — no AI-generated summary reaches the driver
  without passing semantic safety check

---

## Running the Project

### Backend (Google Colab)

1. Open `CORTEX_Backend.ipynb` in Google Colab
2. Run Cell 1 — installs all dependencies
3. Run Cell 2 — writes all backend files to disk
4. Run Cell 3 — add your credentials and start the server:
```python
os.environ["WATSONX_API_KEY"]    = "your_key"
os.environ["WATSONX_PROJECT_ID"] = "your_project_id"
os.environ["WATSONX_URL"]        = "https://eu-de.ml.cloud.ibm.com"
ngrok.set_auth_token("your_ngrok_token")
```
5. Run Cell 4 — get your three URLs

### Frontend

```bash
git clone https://github.com/YOUR_USERNAME/cortex
cd cortex/frontend
npm install

# Create .env:
VITE_WS_URL=wss://your-ngrok-url/ws/telemetry
VITE_RADIO_URL=wss://your-ngrok-url/ws/radio
VITE_API_URL=https://your-ngrok-url

npm run dev
```

---

## Why CORTEX, not NeuroTrack

Other systems ask: *what is the driver's psychological state?*

CORTEX asks: *given that state, should this message reach them right now?*

Measuring cognitive load is the input. Acting on it — intercepting,
summarizing, timing, and delivering communications — is the output.
CORTEX is an intervention system, not an observation system.
That distinction is where races are won.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI/LLM | IBM Granite 4 via watsonx.ai |
| Document Intelligence | IBM Docling |
| Safety | IBM Granite Guardian |
| Backend | Python, FastAPI, WebSockets |
| TTS | Kokoro v1.0 (Apache 2.0, offline-capable) |
| Frontend | React 18, Tailwind CSS, SVG charts |
| Telemetry | Synthetic Monaco GP replay at 10Hz |
| Tunnel | ngrok (Colab → public endpoint) |

---

## Acknowledgements

Built on [FastAPI](https://fastapi.tiangolo.com),
[IBM Granite](https://github.com/ibm-granite-community),
[IBM Docling](https://www.docling.ai),
[OpenF1](https://openf1.org),
[FastF1](https://github.com/theOehrly/Fast-F1),
[Kokoro TTS](https://github.com/hexgrad/kokoro), and
[React](https://react.dev).

---

<div align="center">

**CORTEX · IBM SkillsBuild AI Builders Challenge 2026**

*The pit wall sees the machine. CORTEX protects the mind.*

</div>
