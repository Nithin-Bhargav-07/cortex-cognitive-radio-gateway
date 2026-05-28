
import asyncio, os
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine import compute_cognitive_load, classify_load, should_buffer, get_predictive_buffer
from granite_client import evaluate_radio_message, guardian_check
from replay_server import stream_telemetry
from tts_engine import synthesise


class AppState:
    def __init__(self):
        self.latest_telemetry  = {}
        self.radio_status      = {
            "status": "idle", "original": "", "summary": "",
            "urgency": 0, "audio_b64": "", "lap": 0
        }
        self.buffer_queue      = []
        self.telemetry_clients = []
        self.radio_clients     = []
        self.stop_event        = asyncio.Event()

state = AppState()


async def _broadcast_telemetry(frame: dict):
    dead = []
    for ws in state.telemetry_clients:
        try:
            await ws.send_json(frame)
        except:
            dead.append(ws)
    for ws in dead:
        state.telemetry_clients.remove(ws)


async def _broadcast_radio(payload: dict):
    dead = []
    for ws in state.radio_clients:
        try:
            await ws.send_json(payload)
        except:
            dead.append(ws)
    for ws in dead:
        state.radio_clients.remove(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async def broadcast(frame: dict):
        import random
        cl_score  = compute_cognitive_load(frame)
        cl_label  = classify_load(cl_score)
        buffering = should_buffer(cl_score)

        progress  = (frame.get("x", 0.5))
        predictive = get_predictive_buffer(progress)

        eda = round(8.0 + (17.0 * frame.get("brake", 0) / 100) + random.uniform(-0.5, 0.5), 1)
        hrv = round(60 - (0.25 * cl_score) + random.uniform(-1.5, 1.5), 1)
        eda = max(5.0, min(25.0, eda))
        hrv = max(15.0, min(65.0, hrv))

        frame.update({
            "cl_score":            cl_score,
            "cl_label":            cl_label,
            "buffering":           buffering,
            "eda":                 eda,
            "hrv":                 hrv,
            "predictive_hold":     predictive["predictive_hold"],
            "upcoming_corner":     predictive["upcoming_corner"],
            "corner_seconds_away": predictive["corner_seconds_away"],
        })

        state.latest_telemetry = frame

        if not buffering and state.buffer_queue:
            await _release_buffer(frame)

        await _broadcast_telemetry(frame)

    task = asyncio.create_task(stream_telemetry(broadcast, state.stop_event))
    yield
    state.stop_event.set()
    task.cancel()


app = FastAPI(title="NeuroTrack", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    state.telemetry_clients.append(websocket)
    print(f"[WS/telemetry] Client connected. Total: {len(state.telemetry_clients)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in state.telemetry_clients:
            state.telemetry_clients.remove(websocket)


@app.websocket("/ws/radio")
async def radio_ws(websocket: WebSocket):
    await websocket.accept()
    state.radio_clients.append(websocket)
    print(f"[WS/radio] Client connected. Total: {len(state.radio_clients)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in state.radio_clients:
            state.radio_clients.remove(websocket)


class RadioMessage(BaseModel):
    message:  str
    engineer: Optional[str] = "Race Engineer"


@app.get("/api/health")
async def health():
    return {
        "status":            "ok",
        "telemetry_clients": len(state.telemetry_clients),
        "radio_clients":     len(state.radio_clients),
        "buffered":          len(state.buffer_queue),
        "cl_score":          state.latest_telemetry.get("cl_score", 0)
    }


@app.post("/api/radio/submit")
async def submit_radio(payload: RadioMessage, background_tasks: BackgroundTasks):
    """
    Returns INSTANTLY — Granite runs in background.
    Result pushed to frontend via /ws/radio when ready.
    """
    cl  = state.latest_telemetry.get("cl_score", 0)
    lap = state.latest_telemetry.get("lap", 0)
    predictive = state.latest_telemetry.get("predictive_hold", False)

    if should_buffer(cl) or predictive:
        state.buffer_queue.append(payload.message)
        radio_event = {
            "status": "buffering", "original": payload.message,
            "summary": "", "urgency": 0, "audio_b64": "", "lap": lap
        }
        state.radio_status = radio_event
        # Push buffering event immediately to radio WebSocket
        asyncio.create_task(_broadcast_radio(radio_event))
        return {"status": "buffering", "cl_score": cl, "queued": len(state.buffer_queue)}

    # Process in background — returns 200 instantly, result pushed via WebSocket
    background_tasks.add_task(_process_and_release, payload.message, cl, lap)
    return {"status": "processing", "message": "Granite classifying — result via /ws/radio"}


@app.post("/api/radio/force")
async def force_transmit(payload: RadioMessage, background_tasks: BackgroundTasks):
    cl  = state.latest_telemetry.get("cl_score", 0)
    lap = state.latest_telemetry.get("lap", 0)

    if payload.message in state.buffer_queue:
        state.buffer_queue.remove(payload.message)

    print(f"[FORCE BYPASS] CL={cl}")
    background_tasks.add_task(_process_and_release, payload.message, 0, lap)
    return {"status": "processing", "message": "Force transmit — result via /ws/radio"}


@app.get("/api/radio/queue")
async def get_radio_queue():
    return {
        "queued":   len(state.buffer_queue),
        "messages": [{"message": m, "index": i} for i, m in enumerate(state.buffer_queue)],
        "cl_score": state.latest_telemetry.get("cl_score", 0)
    }


async def _process_and_release(message: str, cl: int, lap: int):
    loop = asyncio.get_event_loop()

    # Run Granite in thread executor so it doesn't block async loop
    result  = await loop.run_in_executor(None, evaluate_radio_message, message, cl)
    summary = result["summary"]
    urgency = result["urgency"]

    is_safe = await loop.run_in_executor(None, guardian_check, summary)
    if not is_safe:
        print(f"[Guardian] Flagged — using original")
        summary = message[:40]

    tts = await loop.run_in_executor(None, synthesise, summary)

    radio_event = {
        "status":    "released",
        "original":  message,
        "summary":   summary,
        "urgency":   urgency,
        "audio_b64": tts["audio_b64"],
        "lap":       lap,
        "guardian_safe": is_safe
    }

    state.radio_status = radio_event
    await _broadcast_radio(radio_event)
    print(f"[Radio] Released — urgency:{urgency} summary:'{summary}'")


async def _release_buffer(frame: dict):
    if not state.buffer_queue:
        return
    combined = " | ".join(state.buffer_queue)
    state.buffer_queue.clear()
    print(f"[Buffer] Auto-releasing")
    await _process_and_release(combined, frame["cl_score"], frame.get("lap", 0))
