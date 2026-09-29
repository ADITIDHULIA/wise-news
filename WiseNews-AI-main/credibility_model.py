"""
credibility_model.py
Input handler + credibility inference pipeline.

Accepts: title, article_text, url (all optional except article_text or url)
Outputs: credibility analysis dict, with summarization optional.
"""

from typing import Optional

from article_input import fetch_article_from_url as _fetch_article_from_url
from article_input import resolve_article_input


def fetch_article_from_url(url: str) -> dict:
    """Backward-compatible wrapper for shared URL article fetching."""
    return _fetch_article_from_url(url)


def analyze_article(
    article_text: Optional[str] = None,
    title: Optional[str] = "",
    url: Optional[str] = None,
    run_summarizer: bool = False,
) -> dict:
    """
    WiseNews credibility analysis pipeline.

    Priority:
      1. Use article_text if provided.
      2. Else fetch from url.

    Args:
        article_text: Raw article body text.
        title: Headline / title string.
        url: Optional source URL.
        run_summarizer: Optional. Set True to attach a summary to the output.

    Returns:
        {
            "final_score": int,
            "credibility_tier": str,
            "breakdown": {...},
            "summary": str,
            "details": {
                "source": {...},
                "emotion": {...},
                "headline": {...},
                "completeness": {...},
                "roberta": {...},
            }
        }
    """
    resolved = resolve_article_input(article_text=article_text, title=title, url=url)
    article_text = resolved["text"]
    title = resolved["title"] or ""

    if not article_text or len(article_text.strip()) < 30:
        raise ValueError("Article text is too short or could not be extracted.")

    from preprocessing.text_cleaner import combine_title_and_text

    combined_text = combine_title_and_text(title, article_text)

    from classification.credibility_classifier import predict_credibility

    roberta_result = predict_credibility(combined_text)
    content_score_normalized = roberta_result["content_score_normalized"]

    from source.source_credibility import get_source_score

    source_result = get_source_score(url or "")
    source_score = source_result["source_score"]

    from scoring.emotion_tone import compute_emotion_score

    emotion_result = compute_emotion_score(article_text)
    emotion_score = emotion_result["emotion_score"]

    from scoring.headline_detector import compute_headline_score

    headline_result = compute_headline_score(title)
    headline_score = headline_result["headline_score"]

    from scoring.completeness import compute_completeness_score

    completeness_result = compute_completeness_score(article_text)
    completeness_score = completeness_result["completeness_score"]

    from score_engine import compute_final_score, interpret_score

    scoring_result = compute_final_score(
        content_score=content_score_normalized,
        source_score=source_score,
        completeness_score=completeness_score,
        emotion_score=emotion_score,
        headline_score=headline_score,
    )

    summary = ""
    if run_summarizer:
        from summarization.summarizer import summarize_article

        summary = summarize_article(article_text)

    return {
        "final_score": scoring_result["final_score"],
        "credibility_tier": interpret_score(scoring_result["final_score"]),
        "breakdown": scoring_result["breakdown"],
        "summary": summary,
        "details": {
            "roberta": roberta_result,
            "source": source_result,
            "emotion": emotion_result,
            "headline": headline_result,
            "completeness": completeness_result,
        },
    }
