# qen_engine.py

from typing import Dict, List


def analyze_system(payload: Dict) -> Dict:
    """
    Motore base QEN:
    - riceve dati del sistema
    - calcola punteggio rischio
    - identifica gap
    - restituisce livello, spiegazione e azioni consigliate
    """

    system_name = payload.get("system_name", "Unnamed System")
    use_case = (payload.get("use_case") or "").strip()

    has_audit_trail = bool(payload.get("has_audit_trail", False))
    has_human_oversight = bool(payload.get("has_human_oversight", False))
    sensitive_data = bool(payload.get("sensitive_data", False))
    has_consent_tracking = bool(payload.get("has_consent_tracking", False))

    score = 0
    gaps: List[str] = []
    recommendations: List[str] = []
    notes: List[str] = []

    # -------------------------
    # Risk scoring
    # -------------------------
    if sensitive_data:
        score += 30
        notes.append("Sensitive data detected")

    if not has_audit_trail:
        score += 20
        gaps.append("Missing audit trail")
        recommendations.append("Implement immutable logging for decisions and events")

    if not has_human_oversight:
        score += 20
        gaps.append("Missing human oversight")
        recommendations.append("Add human review or escalation workflow")

    if sensitive_data and not has_consent_tracking:
        score += 15
        gaps.append("Missing consent tracking")
        recommendations.append("Track consent and legal basis for data processing")

    if use_case:
        lowered = use_case.lower()

        if "recruit" in lowered or "hiring" in lowered or "hr" in lowered:
            score += 20
            notes.append("Potential high-impact employment use case detected")

        if "biometric" in lowered:
            score += 25
            notes.append("Biometric context detected")

        if "credit" in lowered or "scoring" in lowered:
            score += 20
            notes.append("Scoring or financial profiling context detected")

    # -------------------------
    # Risk level mapping
    # -------------------------
    if score >= 70:
        risk_level = "HIGH"
    elif score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    summary = build_summary(
        system_name=system_name,
        risk_level=risk_level,
        score=score,
        gaps=gaps,
        notes=notes
    )

    return {
        "system_name": system_name,
        "risk_score": score,
        "risk_level": risk_level,
        "gaps": gaps,
        "recommendations": recommendations,
        "notes": notes,
        "summary": summary
    }


def build_summary(
    system_name: str,
    risk_level: str,
    score: int,
    gaps: List[str],
    notes: List[str]
) -> str:
    parts = [
        f"System '{system_name}' analyzed.",
        f"Risk level: {risk_level}.",
        f"Score: {score}."
    ]

    if gaps:
        parts.append("Main gaps: " + ", ".join(gaps) + ".")

    if notes:
        parts.append("Context notes: " + ", ".join(notes) + ".")

    return " ".join(parts)
