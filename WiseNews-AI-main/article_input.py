"""
article_input.py
Shared input resolution utilities for WiseNews features.

These helpers let summarization and credibility scoring accept either pasted
article text or a URL, without depending on one another.
"""

from typing import Optional


def fetch_article_from_url(url: str) -> dict:
    """
    Download and parse article from URL using newspaper3k.
    Falls back to BeautifulSoup if newspaper3k fails.

    Returns:
        {"title": str, "text": str, "url": str}
    """
    title, text = "", ""

    try:
        from newspaper import Article

        article = Article(url)
        article.download()
        article.parse()
        title = article.title or ""
        text = article.text or ""
    except Exception as e:
        print(f"[newspaper3k] Failed ({e}), trying BeautifulSoup fallback...")
        try:
            import requests
            from bs4 import BeautifulSoup

            resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, "html.parser")
            paragraphs = soup.find_all("p")
            text = " ".join(p.get_text() for p in paragraphs)
            title_tag = soup.find("title")
            title = title_tag.get_text() if title_tag else ""
        except Exception as e2:
            print(f"[BeautifulSoup] Also failed: {e2}")

    return {"title": title.strip(), "text": text.strip(), "url": url}


def resolve_article_input(
    article_text: Optional[str] = None,
    title: Optional[str] = "",
    url: Optional[str] = None,
) -> dict:
    """
    Resolve article input from direct text or by fetching from a URL.

    Returns:
        {"title": str, "text": str, "url": Optional[str]}
    """
    resolved_title = (title or "").strip()
    resolved_text = (article_text or "").strip()

    if not resolved_text:
        if not url:
            raise ValueError("Provide either article_text or a url.")
        print(f"Fetching article from: {url}")
        fetched = fetch_article_from_url(url)
        resolved_text = fetched["text"]
        if not resolved_title:
            resolved_title = fetched["title"]

    return {
        "title": resolved_title,
        "text": resolved_text.strip(),
        "url": url,
    }
