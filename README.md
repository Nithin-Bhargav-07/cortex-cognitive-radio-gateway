# NeuroTrack

A production-grade Formula 1 cognitive radio gateway and asynchronous telemetry processing platform.

## The Problem and Solution

Managing information bandwidth during high-stress operational phases is critical at speeds exceeding 300 km/h. Unsolicited radio transmissions from race engineering systems directly impact driver cognitive load, elevating the risk of unforced errors during heavy braking, cornering, or wheel-to-wheel combat. 

NeuroTrack introduces an asynchronous, AI-driven radio buffer to safely govern human bandwidth. By intercepting raw audio transmissions and classifying message urgency via IBM Watsonx Granite, the system dynamically holds non-critical communications in an intelligent buffer. The system calculates real-time driver biometric load via a custom 60Hz FastAPI synthetic physics engine, only releasing buffered audio through the Kokoro TTS engine when physical thresholds permit. In parallel, IBM Docling parses official FIA track notes, allowing the system to preemptively enact communication blackout zones before the vehicle enters known high-stress sectors.

## System Architecture and Features

The platform is strictly segregated into three discrete operational views.

### Command Terminal
Provides primary oversight of the AI classification pipeline, biometric analysis, and dynamic cognitive load thresholds. Displays real-time communication queuing, buffer states, and raw telemetry to monitor the asynchronous Watsonx and Docling processing layers.

![Command View](./command-view.jpg)

### Lap Intelligence
Delivers high-fidelity, distance-based overlaid telemetry traces to analyze vehicle performance deltas. The visualization engine incorporates a discrete-dot global tracking map capable of simultaneously plotting ego-vehicle gear traces and multi-car rival traffic data entirely independent of continuous SVG pathing.

![Lap Intelligence](./lap-intelligence.jpg)

### Car Systems Health
Aggregates critical mechanical and aerodynamic health metrics into a dense diagnostic matrix. Monitors specific 4-corner brake thermals, suspension travel matrices, MGU-K energy harvesting deployments, and continuous predictive tire degradation modeling.

![Car Systems](./car-systems.jpg)

## Technology Stack

The architecture relies on strict separation of concerns across multiple network layers:
*   **Frontend**: React, Tailwind CSS, Vite (Synchronous data visualization layer)
*   **Streaming Layer**: FastAPI, WebSockets (60Hz physical telemetry ingestion)
*   **Background Workers**: IBM Watsonx Granite, IBM Docling (Asynchronous NLP and document parsing)
*   **Audio Synthesis**: Kokoro TTS (Voice delivery and buffering)

## Local Execution

To initialize the backend physics engine and WebSocket streaming server:
```bash
# Navigate to the backend directory
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

To initialize the frontend telemetry visualization dashboard:
```bash
# Navigate to the frontend directory
npm run dev
```
