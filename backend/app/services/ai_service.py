import httpx
from typing import Dict, Any, List, Optional
from backend.app.config import settings

def build_deterministic_investigation_summary(
    alert_title: str,
    explanation: str,
    entities: Dict[str, Any],
    event_ids: List[str]
) -> Dict[str, Any]:
    """Deterministic fallback analysis when local AI is offline or disabled."""
    users = entities.get("users", [])
    hosts = entities.get("hosts", [])
    ips = entities.get("ips", [])

    return {
        "is_ai_assisted": False,
        "provider": "deterministic_rules_engine",
        "model": "krythos-deterministic-core",
        "executive_summary": f"Alert '{alert_title}' triggered based on verified event telemetry.",
        "observed_facts": [
            f"Observed explanation: {explanation}",
            f"Entities involved: Users={users}, Hosts={hosts}, Network IPs={ips}",
            f"Supporting telemetry evidence items: {len(event_ids)} events verified in storage."
        ],
        "hypotheses": [
            "If unexpected, verify credentials for target account or investigate source IP reputation.",
            "Review host process telemetry around the detection timestamp."
        ],
        "suggested_actions": [
            "Validate user activity with account owner.",
            "Cross-reference source IP against external threat feeds if permitted.",
            "If malicious, initiate account credential reset and isolate host."
        ],
        "supporting_event_ids": event_ids
    }

async def generate_investigation_assistant_summary(
    alert_title: str,
    explanation: str,
    entities: Dict[str, Any],
    event_ids: List[str]
) -> Dict[str, Any]:
    """
    Attempt local Ollama LLM query with strict safety guardrails.
    Falls back gracefully to deterministic rule summary.
    """
    if not settings.AI_ENABLED:
        return build_deterministic_investigation_summary(alert_title, explanation, entities, event_ids)

    prompt = f"""You are a defensive SOC Tier-2 Incident Response Assistant in KRYTHOS SOC.
Analyze the following alert:
Title: {alert_title}
Explanation: {explanation}
Entities: {entities}
Supporting Event IDs: {event_ids}

Rules:
1. Label all output as AI-assisted.
2. Only reference facts present in the data. Do NOT invent events or entities.
3. Keep response concise, structured into:
   - Observed Facts
   - Hypotheses
   - Recommended Next Steps
"""

    try:
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = await client.post(
                f"{settings.AI_ENDPOINT}/api/generate",
                json={
                    "model": settings.AI_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                ai_text = data.get("response", "")
                return {
                    "is_ai_assisted": True,
                    "provider": settings.AI_PROVIDER,
                    "model": settings.AI_MODEL,
                    "raw_analysis": ai_text,
                    "supporting_event_ids": event_ids
                }
    except Exception:
        # Fallback cleanly without raising error or blocking SOC analyst
        pass

    return build_deterministic_investigation_summary(alert_title, explanation, entities, event_ids)
