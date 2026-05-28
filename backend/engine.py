
import json

# ── Sector map from Docling (hardcoded values matching frontend table)
SECTOR_MAP = [
    {"name": "Ste Devote",    "progress": 0.02, "expected_load": 85, "sector": 1},
    {"name": "Massenet",      "progress": 0.12, "expected_load": 78, "sector": 1},
    {"name": "Mirabeau",      "progress": 0.38, "expected_load": 82, "sector": 2},
    {"name": "Loews Hairpin", "progress": 0.42, "expected_load": 90, "sector": 2},
    {"name": "Portier",       "progress": 0.48, "expected_load": 75, "sector": 2},
]

def compute_cognitive_load(row: dict) -> int:
    speed     = float(row.get("speed", 0))
    brake     = float(row.get("brake", 0))
    throttle  = float(row.get("throttle", 0))
    n_gear    = int(row.get("n_gear", 4))
    gap_ahead = float(row.get("gap_ahead", 99))
    gap_behind= float(row.get("gap_behind", 99))
    in_battle = gap_ahead < 1.0 or gap_behind < 1.0

    brake_score      = brake * 0.50
    speed_score      = min(speed / 350, 1.0) * 25
    coast_score      = 15 if throttle < 10 and brake < 10 else 0
    low_gear_bonus   = 20 if n_gear <= 3 and brake > 50 else 0
    throttle_relief  = 15 if throttle > 90 and brake == 0 else 0
    simulated_g      = (brake * 0.05) + (speed * 0.01 if throttle > 50 and speed > 200 else 0)
    g_force_penalty  = min(simulated_g * 2.5, 25)

    raw = brake_score + speed_score + coast_score + low_gear_bonus + g_force_penalty - throttle_relief
    if in_battle:
        raw += 20

    return max(0, min(100, int(raw)))


def classify_load(cl_score: int) -> str:
    if cl_score <= 45:
        return "NORMAL BANDWIDTH"
    elif cl_score <= 75:
        return "CAUTION"
    else:
        return "BUFFERING - LOAD CRITICAL"


def should_buffer(cl_score: int, threshold: int = 70) -> bool:
    return cl_score >= threshold


def get_predictive_buffer(progress: float) -> dict:
    """
    Looks ahead on the track. If a high-load corner is within
    ~3 seconds (progress 0.04 at race pace), return predictive hold.
    This is the Docling integration — acting BEFORE the telemetry spikes.
    """
    for corner in SECTOR_MAP:
        distance_away = corner["progress"] - progress
        if 0.0 < distance_away < 0.04:
            return {
                "predictive_hold": True,
                "upcoming_corner": corner["name"],
                "corner_seconds_away": round(distance_away / 0.04 * 3, 1)
            }
    return {
        "predictive_hold": False,
        "upcoming_corner": "",
        "corner_seconds_away": 0
    }
