"""
score_engine.py
Combines all factor scores into the final Credibility Confidence Score (0–100).

Weights:
  Content Score (RoBERTa)  50
  Source Credibility       25
  Content Completeness      5
  Emotional Tone           10
  Deceptive Headline       10
"""

from typing import Optional


# ── Weight table ──────────────────────────────────────────────────────────────
WEIGHTS = {
    "content_score": 50,
    "source_score": 25,
    "completeness_score": 5,
    "emotion_score": 10,
    "headline_score": 10,
}


def _normalize_score(score: float, *, weight: Optional[float] = None) -> float:
    """
    Normalize a score into the [0, 1] range.

    If a weighted score and its max weight are provided, convert it back to a
    normalized value. This keeps the engine safe if callers pass a content
    score that is already on the 50-point scale.
    """
    if weight is not None and 1.0 < score <= weight:
        score = score / weight
    return max(0.0, min(1.0, score))


def compute_final_score(
    content_score: float,
    source_score: float,
    completeness_score: float,
    emotion_score: float,
    headline_score: float,
) -> dict:
    """
    Apply the weighted formula and return the final score and breakdown.

    Input scores are expected in [0, 1], except content_score which may be
    supplied either normalized or already on the 50-point content scale.
    The output score is in [0, 100].

    Returns:
        {
            "final_score": int,       
            "breakdown": {
                "content_score":      float,   
                "source_score":       float,   
                "completeness_score": float,   
                "emotion_score":      float,   
                "headline_score":     float,   
            }
        }
    """
    normalized_content = _normalize_score(content_score, weight=WEIGHTS["content_score"])
    normalized_source = _normalize_score(source_score)
    normalized_completeness = _normalize_score(completeness_score)
    normalized_emotion = _normalize_score(emotion_score)
    normalized_headline = _normalize_score(headline_score)

    weighted_content = normalized_content * WEIGHTS["content_score"]
    weighted_source = normalized_source * WEIGHTS["source_score"]
    weighted_completeness = normalized_completeness * WEIGHTS["completeness_score"]
    weighted_emotion = normalized_emotion * WEIGHTS["emotion_score"]
    weighted_headline = normalized_headline * WEIGHTS["headline_score"]

    raw_total = (
        weighted_content
        + weighted_source
        + weighted_completeness
        + weighted_emotion
        + weighted_headline
    )

    # Clamp to [0, 100] and round to nearest integer
    final_score = int(round(max(0.0, min(100.0, raw_total))))

    return {
        "final_score": final_score,
        "breakdown": {
            "content_score":      round(weighted_content, 2),
            "source_score":       round(weighted_source, 2),
            "completeness_score": round(weighted_completeness, 2),
            "emotion_score":      round(weighted_emotion, 2),
            "headline_score":     round(weighted_headline, 2),
        },
    }


def interpret_score(score: int) -> str:
    """Return a human-readable credibility tier for a given score."""
    if score >= 80:
        return "High Credibility"
    elif score >= 60:
        return "Moderate Credibility"
    elif score >= 40:
        return "Mixed / Uncertain"
    elif score >= 20:
        return "Low Credibility"
    else:
        return "Very Low Credibility"
