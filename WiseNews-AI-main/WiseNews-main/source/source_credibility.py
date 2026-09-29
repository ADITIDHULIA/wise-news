from urllib.parse import urlparse
from datetime import datetime
import re

DEFAULT_SCORE = 0.5

# ── Expanded source credibility map ───────────────────────────────────────────
SOURCE_SCORES = {
    # Very High
    "reuters.com": 1.0,
    "apnews.com": 1.0,
    "bbc.com": 1.0,
    "npr.org": 1.0,

    # High
    "nytimes.com": 0.9,
    "theguardian.com": 0.9,
    "economist.com": 0.9,

    # Indian (IMPORTANT)
    "thehindu.com": 0.9,
    "indianexpress.com": 0.9,
    "scroll.in": 0.85,
    "ndtv.com": 0.75,
    "hindustantimes.com": 0.75,
    "timesofindia.indiatimes.com": 0.6,

    # Mixed
    "cnn.com": 0.75,
    "foxnews.com": 0.5,
    "vox.com": 0.5,

    # Low
    "dailymail.co.uk": 0.3,

    # Very Low
    "infowars.com": 0.1,
}

# ── Suspicious domain patterns ───────────────────────────────────────────────
SUSPICIOUS_PATTERNS = [
    "news", "truth", "viral", "update", "daily",
    "real", "breaking", "alert", "exposed"
]


# ── Extract domain ───────────────────────────────────────────────────────────
def extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        parsed = urlparse(url if url.startswith("http") else f"http://{url}")
        domain = parsed.netloc.lower()
        domain = domain.removeprefix("www.")
        return domain
    except Exception:
        return ""


# ── Subdomain-aware lookup ───────────────────────────────────────────────────
def get_base_source_score(domain: str) -> float:
    for key in SOURCE_SCORES:
        if domain.endswith(key):
            return SOURCE_SCORES[key]
    return DEFAULT_SCORE


# ── Suspicious domain detection ──────────────────────────────────────────────
def suspicious_domain_penalty(domain: str) -> float:
    count = sum(1 for word in SUSPICIOUS_PATTERNS if word in domain)
    if count >= 2:
        return 0.6
    elif count == 1:
        return 0.8
    return 1.0


# ── HTTPS signal ─────────────────────────────────────────────────────────────
def https_score(url: str) -> float:
    return 1.0 if url.startswith("https") else 0.7


# ── Domain age scoring (WHOIS) ───────────────────────────────────────────────
def domain_age_score(domain: str) -> float:
    try:
        import whois
        w = whois.whois(domain)

        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]

        if not creation_date:
            return 0.5

        age_days = (datetime.now() - creation_date).days

        if age_days > 5 * 365:
            return 1.0
        elif age_days > 365:
            return 0.7
        else:
            return 0.3

    except Exception:
        return 0.5


# ── MAIN FUNCTION ────────────────────────────────────────────────────────────
def get_source_score(url: str) -> dict:
    domain = extract_domain(url)

    base_score = get_base_source_score(domain)
    age_score = domain_age_score(domain)
    https_val = https_score(url)
    suspicious_penalty = suspicious_domain_penalty(domain)

    # Final weighted score
    final_score = (
        0.5 * base_score +
        0.2 * age_score +
        0.15 * https_val +
        0.15 * suspicious_penalty
    )

    final_score = round(max(0.0, min(1.0, final_score)), 4)

    # Rating interpretation
    if final_score >= 0.85:
        rating = "Very High"
    elif final_score >= 0.7:
        rating = "High"
    elif final_score >= 0.55:
        rating = "Moderate"
    elif final_score >= 0.35:
        rating = "Low"
    else:
        rating = "Very Low"

    return {
        "domain": domain or "unknown",
        "source_score": final_score,
        "rating": rating,
        "details": {
            "base_score": base_score,
            "domain_age_score": age_score,
            "https_score": https_val,
            "suspicious_penalty": suspicious_penalty,
        }
    }