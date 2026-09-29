"""
preprocessing/text_cleaner.py
Handles text cleaning and preparation for RoBERTa (max 512 tokens).
"""

import re
import unicodedata
from bs4 import BeautifulSoup


def remove_html(text: str) -> str:
    """Strip HTML tags using BeautifulSoup."""
    return BeautifulSoup(text, "html.parser").get_text(separator=" ")


def normalize_whitespace(text: str) -> str:
    """Collapse multiple spaces/newlines into a single space."""
    return re.sub(r"\s+", " ", text).strip()


def remove_special_characters(text: str) -> str:
    """Normalize Unicode and drop only non-printable control characters."""
    normalized = unicodedata.normalize("NFKC", text)
    return "".join(ch if (ch.isprintable() or ch in "\r\n\t") else " " for ch in normalized)


def clean_text(text: str) -> str:
    """Full cleaning pipeline."""
    text = remove_html(text)
    text = remove_special_characters(text)
    text = normalize_whitespace(text)
    return text


def combine_title_and_text(title: str, article_text: str) -> str:
    """
    Combine title and article body.
    Title is prepended with a separator so the model sees context.
    """
    title = clean_text(title) if title else ""
    body = clean_text(article_text) if article_text else ""
    if title:
        return f"{title} [SEP] {body}"
    return body


def truncate_to_tokens(text: str, tokenizer, max_tokens: int = 512) -> str:
    """
    Tokenize text and truncate to max_tokens, then decode back to string.
    Ensures RoBERTa never receives sequences longer than its context window.
    """
    tokens = tokenizer.encode(text, add_special_tokens=False)
    if len(tokens) > max_tokens - 2:  # reserve 2 for [CLS] and [SEP]
        tokens = tokens[: max_tokens - 2]
    return tokenizer.decode(tokens, skip_special_tokens=True)
