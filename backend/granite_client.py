
import os, json, re
from ibm_watsonx_ai.foundation_models import ModelInference

BYPASS_KEYWORDS = [
    "safety car", "red flag", "fire", "failure", "crash",
    "brake failure", "box box", "danger", "yellow flag", "debris"
]

def _get_model():
    return ModelInference(
        model_id="ibm/granite-4-h-small",  # only Granite model in your environment
        params={"decoding_method": "greedy", "max_new_tokens": 60, "temperature": 0.0},
        credentials={
            "url":    os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com"),
            "apikey": os.environ.get("WATSONX_API_KEY")
        },
        project_id=os.environ.get("WATSONX_PROJECT_ID")
    )

def evaluate_radio_message(message: str, cl_score: int) -> dict:
    # Fast keyword bypass — no LLM call needed
    msg_lower = message.lower()
    for kw in BYPASS_KEYWORDS:
        if kw in msg_lower:
            words = message.split()[:3]
            return {
                "urgency": 3,
                "summary": " ".join(words),
                "bypass":  True,
                "guardian_safe": True
            }

    prompt = f"""You are an F1 pit wall radio AI. Classify this message urgency and summarize it.
Reply ONLY with valid JSON. No explanation, no markdown.

Urgency levels:
1 = Routine info (gaps, positions)
2 = Strategy update (pit window, engine mode)
3 = Safety or immediate action required

Driver cognitive load right now: {cl_score}/100
Message: "{message}"

Reply format: {{"urgency": 1, "summary": "short 3 word summary"}}"""

    try:
        model = _get_model()
        raw   = model.generate_text(prompt=prompt)
        # Extract JSON robustly
        match = re.search(r'\{[^}]+\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
            return {
                "urgency":      int(result.get("urgency", 2)),
                "summary":      str(result.get("summary", message[:25])),
                "bypass":       False,
                "guardian_safe": True
            }
        # If JSON parse fails, use raw as summary
        return {"urgency": 2, "summary": raw.strip()[:30], "bypass": False, "guardian_safe": True}

    except Exception as e:
        print(f"[Granite] Error: {e}")
        # Failsafe — treat as urgency 2, deliver original
        return {"urgency": 2, "summary": message[:30], "bypass": False, "guardian_safe": True}


def guardian_check(summary: str) -> bool:
    """
    Simplified Guardian check using same model.
    Returns True if safe to deliver.
    """
    dangerous_phrases = [
        "do not brake", "ignore", "speed up into", "wrong way",
        "overtake under red"
    ]
    summary_lower = summary.lower()
    for phrase in dangerous_phrases:
        if phrase in summary_lower:
            print(f"[Guardian] Flagged phrase: '{phrase}'")
            return False
    return True
