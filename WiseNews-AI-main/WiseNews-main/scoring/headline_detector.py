"""
scoring/headline_detector.py
Detects clickbait / deceptive patterns in article headlines.
Score ∈ [0,1] where 1 = clean headline, 0 = heavily clickbait.
"""

import re

# Clickbait phrase patterns (case-insensitive)
CLICKBAIT_PHRASES = [
    r"you won'?t believe",
    r"what happened next",
    r"this is why",
    r"the reason will shock you",
    r"mind[- ]?blow(ing)?",
    r"must[- ]?see",
    r"what they don'?t want you to know",
    r"they'?re hiding",
    r"the truth about",
    r"doctors hate",
    r"one weird trick",
    r"number \d+ will shock you",
    r"here'?s why",
    r"this is what",
    r"you need to see this",
    r"share before it'?s deleted",
    r"breaking[!]{2,}",
    r"urgent[!]+",
    r"exposed[!]+",
]

EMOTIONAL_HEADLINE_WORDS = {
    "shocking", "bombshell", "explosive", "stunning", "unbelievable",
    "incredible", "outrageous", "terrifying", "devastating", "alarming",
    "secret", "revealed", "exposed", "breaking", "urgent", "critical",
}


def _has_excessive_caps(title: str) -> bool:
    """True if more than 50% of alpha chars are uppercase."""
    letters = [c for c in title if c.isalpha()]
    if len(letters) < 5:
        return False
    return sum(1 for c in letters if c.isupper()) / len(letters) > 0.5


def _has_excessive_punctuation(title: str) -> bool:
    """True if title contains 2+ consecutive '!' or '?' marks."""
    return bool(re.search(r"[!?]{2,}", title))


def _clickbait_phrase_count(title: str) -> int:
    """Number of clickbait phrase patterns matched."""
    title_lower = title.lower()
    return sum(1 for pattern in CLICKBAIT_PHRASES if re.search(pattern, title_lower))


def _emotional_word_count(title: str) -> int:
    """Number of emotionally loaded words in the headline."""
    title_lower = title.lower()
    words = re.findall(r"\b\w+\b", title_lower)
    return sum(1 for w in words if w in EMOTIONAL_HEADLINE_WORDS)


def compute_headline_score(title: str) -> dict:
    """
    Analyse headline for deceptive / clickbait patterns.

    Returns:
        {
            "headline_score": float,       # 0–1 (1 = trustworthy headline)
            "excessive_caps": bool,
            "excessive_punctuation": bool,
            "clickbait_phrases_found": int,
            "emotional_words_found": int,
        }
    """
    if not title or not title.strip():
        # No headline provided; neutral score
        return {
            "headline_score": 0.5,
            "excessive_caps": False,
            "excessive_punctuation": False,
            "clickbait_phrases_found": 0,
            "emotional_words_found": 0,
        }

    exc_caps = _has_excessive_caps(title)
    exc_punct = _has_excessive_punctuation(title)
    cb_count = _clickbait_phrase_count(title)
    emo_count = _emotional_word_count(title)

    # Each flag contributes a penalty
    penalty = (
        0.30 * int(exc_caps)
        + 0.20 * int(exc_punct)
        + 0.30 * min(cb_count / 2.0, 1.0)   # 2+ phrases → max penalty
        + 0.20 * min(emo_count / 3.0, 1.0)  # 3+ emotional words → max penalty
    )

    headline_score = round(max(0.0, min(1.0, 1.0 - penalty)), 4)

    return {
        "headline_score": headline_score,
        "excessive_caps": exc_caps,
        "excessive_punctuation": exc_punct,
        "clickbait_phrases_found": cb_count,
        "emotional_words_found": emo_count,
    }
