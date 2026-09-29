"""
scoring/completeness.py
Evaluates the evidence quality and factual completeness of an article.
Uses regex for dates/numbers and spaCy NER for named entities.
Score ∈ [0,1] where 1 = well-evidenced, structured article.
"""

import re

# Lazy-load spaCy to avoid startup cost when module is imported
_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise OSError(
                "spaCy model not found. Run: python -m spacy download en_core_web_sm"
            )
    return _nlp


# ── Individual signal detectors ───────────────────────────────────────────────

DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}"      # 12/05/2024
    r"|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?"
    r"|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}"       # January 5th, 2024
    r"|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b",            # 2024-01-05
    re.IGNORECASE,
)

NUMBER_STAT_PATTERN = re.compile(
    r"\b\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent|million|billion|trillion|thousand))?\b"
)

SOURCE_REFERENCE_PATTERN = re.compile(
    r"\b(?:according to|cited by|reported by|sourced from|study by|"
    r"research(?:ers)? (?:at|from)|published in|stated by|data from|"
    r"survey by|poll by)\b",
    re.IGNORECASE,
)


def _count_dates(text: str) -> int:
    return len(DATE_PATTERN.findall(text))


def _count_statistics(text: str) -> int:
    return len(NUMBER_STAT_PATTERN.findall(text))


def _count_source_references(text: str) -> int:
    return len(SOURCE_REFERENCE_PATTERN.findall(text))


def _count_named_entities(text: str) -> dict:
    """Return counts of key NER types (PERSON, ORG, GPE, DATE, EVENT)."""
    nlp = _get_nlp()
    doc = nlp(text[:50_000])  # limit for performance
    counts = {}
    for ent in doc.ents:
        counts[ent.label_] = counts.get(ent.label_, 0) + 1
    return counts


# ── Master scorer ─────────────────────────────────────────────────────────────

def compute_completeness_score(text: str) -> dict:
    """
    Assess content completeness via evidence signals.

    Returns:
        {
            "completeness_score": float,   # 0–1
            "date_count": int,
            "stat_count": int,
            "source_ref_count": int,
            "named_entity_count": int,
            "article_length_words": int,
        }
    """
    word_count = len(text.split())
    date_count = _count_dates(text)
    stat_count = _count_statistics(text)
    src_count = _count_source_references(text)
    ner_counts = _count_named_entities(text)
    named_entity_count = sum(
        ner_counts.get(t, 0) for t in ("PERSON", "ORG", "GPE", "EVENT", "LAW")
    )

    # ── Sub-scores (each 0–1) ──────────────────────────────────────────────
    # 1. Article length: reward articles > 200 words, penalise very short ones
    length_score = min(word_count / 300.0, 1.0)

    # 2. Dates present
    date_score = min(date_count / 3.0, 1.0)

    # 3. Statistics / numbers
    stat_score = min(stat_count / 5.0, 1.0)

    # 4. Source citations
    src_score = min(src_count / 3.0, 1.0)

    # 5. Named entities (indicates specificity)
    ner_score = min(named_entity_count / 10.0, 1.0)

    # Weighted combination
    completeness_score = (
        0.20 * length_score
        + 0.20 * date_score
        + 0.20 * stat_score
        + 0.20 * src_score
        + 0.20 * ner_score
    )

    return {
        "completeness_score": round(completeness_score, 4),
        "date_count": date_count,
        "stat_count": stat_count,
        "source_ref_count": src_count,
        "named_entity_count": named_entity_count,
        "article_length_words": word_count,
    }
