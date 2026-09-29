"""
summarization/summarizer.py
Generates a 3-5 sentence abstractive summary using facebook/bart-large-cnn.
Model is loaded lazily and cached at module level.
"""

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_NAME = "facebook/bart-large-cnn"
_summarizer = None


def _get_summarizer():
    global _summarizer
    if _summarizer is None:
        print(f"Loading BART summarizer ({MODEL_NAME})...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, local_files_only=True)
            model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, local_files_only=True)
        except Exception:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        if getattr(model.generation_config, "forced_bos_token_id", None) is None:
            model.generation_config.forced_bos_token_id = 0
        model.eval()
        _summarizer = (tokenizer, model)
        print("Summarizer ready.")
    return _summarizer


def summarize_article(text: str, max_length: int = 180, min_length: int = 60) -> str:
    """
    Generate an abstractive summary of the article.

    Args:
        text: Article body text (truncated to 1024 tokens internally).
        max_length: Maximum summary length in tokens (~3-5 sentences).
        min_length: Minimum summary length in tokens.

    Returns:
        Summary string.
    """
    if not text or len(text.strip()) < 100:
        return "Article is too short to summarize."

    try:
        tokenizer, model = _get_summarizer()

        # BART has a 1024-token limit; this keeps inputs within that range.
        truncated_text = text[:4096]
        inputs = tokenizer(
            truncated_text,
            return_tensors="pt",
            max_length=1024,
            truncation=True,
        )

        with torch.no_grad():
            summary_ids = model.generate(
                **inputs,
                max_length=max_length,
                min_length=min_length,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3,
                forced_bos_token_id=0,
            )

        return tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
    except Exception as e:
        return f"Summary unavailable: {e}"
