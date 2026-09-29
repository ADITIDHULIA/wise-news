"""
scoring/emotion_tone.py
Detects emotional intensity / sensationalism in article text.

Approach: rule-based keyword scoring + punctuation density.
Score ∈ [0,1] where 1 = highly neutral, 0 = highly sensational/emotional.
"""

import re

# Sensational / emotionally loaded phrases and words
SENSATIONAL_WORDS = {
    # Strong emotional triggers
    "shocking", "outrageous", "unbelievable", "horrifying", "terrifying",
    "explosive", "bombshell", "scandalous", "devastating", "alarming",
    "disgusting", "infuriating", "heartbreaking", "stunning", "jaw-dropping",
    # Hyperbole
    "never before", "all-time", "record-breaking", "unprecedented",
    "worst ever", "best ever", "biggest ever", "most dangerous",
    # Fear/urgency signals
    "emergency", "crisis", "catastrophe", "disaster", "chaos",
    "collapse", "destroy", "annihilate", "wipe out",
    # Conspiracy / distrust triggers
    "they don't want you to know", "hidden truth", "cover-up",
    "secret", "exposed", "revealed", "mainstream media won't",
    "what they're hiding",
}

# Calm, factual language (positive signals)
NEUTRAL_PHRASES = {
    "according to", "researchers say", "study shows", "data indicates",
    "officials stated", "the report found", "analysts noted",
    "experts believe", "evidence suggests", "statistics show",
}


def _count_caps_ratio(text: str) -> float:
    """Proportion of uppercase letters (excluding spaces)."""
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    return sum(1 for c in letters if c.isupper()) / len(letters)


def _count_exclamation_density(text: str) -> float:
    """Exclamation marks per 100 words."""
    words = text.split()
    if not words:
        return 0.0
    excl = text.count("!")
    return min(excl / max(len(words) / 100, 1), 1.0)


def _sensational_hit_rate(text: str) -> float:
    """Fraction of sensational terms found (capped at 1)."""
    text_lower = text.lower()
    hits = sum(1 for term in SENSATIONAL_WORDS if term in text_lower)
    return min(hits / 5.0, 1.0)  # 5+ hits → fully sensational


def _neutral_hit_rate(text: str) -> float:
    """Fraction of neutral/factual phrases found."""
    text_lower = text.lower()
    hits = sum(1 for phrase in NEUTRAL_PHRASES if phrase in text_lower)
    return min(hits / 4.0, 1.0)  # 4+ neutral phrases → fully neutral


def compute_emotion_score(text: str) -> dict:
    """
    Compute emotional neutrality score.

    Returns:
        {
            "emotion_score": float,      # 0–1 (higher = more neutral/credible)
            "caps_ratio": float,
            "exclamation_density": float,
            "sensational_hits": int,
            "neutral_hits": int,
        }
    """
    text_lower = text.lower()

    caps_ratio = _count_caps_ratio(text)
    excl_density = _count_exclamation_density(text)
    sens_rate = _sensational_hit_rate(text)
    neut_rate = _neutral_hit_rate(text)

    # Penalty components (each 0–1, higher = worse)
    penalty = (
        0.3 * min(caps_ratio * 3, 1.0)   # heavily penalise ALL CAPS text
        + 0.3 * min(excl_density, 1.0)   # penalise exclamation spam
        + 0.4 * sens_rate                 # penalise sensational vocabulary
    )

    # Bonus for neutral/factual language (offsets penalty slightly)
    bonus = 0.15 * neut_rate

    raw_score = 1.0 - penalty + bonus
    emotion_score = round(max(0.0, min(1.0, raw_score)), 4)

    return {
        "emotion_score": emotion_score,
        "caps_ratio": round(caps_ratio, 4),
        "exclamation_density": round(excl_density, 4),
        "sensational_hit_count": int(sum(1 for t in SENSATIONAL_WORDS if t in text_lower)),
        "neutral_phrase_count": int(sum(1 for p in NEUTRAL_PHRASES if p in text_lower)),
    }
