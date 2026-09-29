"""
main.py
WiseNews CLI entry point.

Usage examples:
  # Combined credibility + summary
  python main.py --mode full --url "https://apnews.com/article/..."

  # Credibility scoring only
  python main.py --mode credibility --url "https://apnews.com/article/..."

  # Summarization only
  python main.py --mode summary --url "https://apnews.com/article/..."

  # Analyze pasted text directly
  python main.py --mode credibility --text "Article body here..." --title "Headline"

  # Pretty-print detailed factor breakdown
  python main.py --mode credibility --text "..." --verbose
"""

import argparse
import json
import sys

from score_engine import WEIGHTS


def parse_args():
    parser = argparse.ArgumentParser(
        description="WiseNews CLI for credibility scoring and summarization"
    )
    parser.add_argument(
        "--mode",
        choices=["full", "credibility", "summary"],
        default="full",
        help="Choose combined mode, credibility-only mode, or summary-only mode.",
    )
    parser.add_argument("--text", type=str, default=None, help="Article body text")
    parser.add_argument("--title", type=str, default="", help="Article headline")
    parser.add_argument("--url", type=str, default=None, help="Article source URL")
    parser.add_argument(
        "--verbose", action="store_true", help="Print detailed factor breakdown"
    )
    return parser.parse_args()


def print_credibility_result(result: dict, verbose: bool = False, show_summary: bool = False):
    """Pretty-print the credibility analysis result."""
    score = result["final_score"]
    tier = result["credibility_tier"]

    filled = int(score / 5)
    bar = "#" * filled + "." * (20 - filled)

    print("\n" + "=" * 52)
    print(f"  WiseNews Credibility Score: {score}/100")
    print(f"  [{bar}]  {tier}")
    print("=" * 52)

    print("\nScore Breakdown:")
    bd = result["breakdown"]
    print(
        f"  Content (RoBERTa)   : {bd['content_score']:.1f} / "
        f"{WEIGHTS['content_score']}"
    )
    print(
        f"  Source Credibility  : {bd['source_score']:.1f} / "
        f"{WEIGHTS['source_score']}"
    )
    print(
        f"  Content Completeness: {bd['completeness_score']:.1f} / "
        f"{WEIGHTS['completeness_score']}"
    )
    print(
        f"  Emotional Tone      : {bd['emotion_score']:.1f} / "
        f"{WEIGHTS['emotion_score']}"
    )
    print(
        f"  Headline Quality    : {bd['headline_score']:.1f} / "
        f"{WEIGHTS['headline_score']}"
    )

    if show_summary and result.get("summary"):
        print(f"\nSummary:\n  {result['summary']}")

    if verbose:
        print("\nDetailed Analysis:")
        print(json.dumps(result["details"], indent=2))

    print()


def print_summary_result(summary: str):
    print("\n" + "=" * 52)
    print("  WiseNews Summary")
    print("=" * 52)
    print(f"\n{summary}\n")


def run_summary_mode(args) -> int:
    from article_input import resolve_article_input
    from summarization.summarizer import summarize_article

    resolved = resolve_article_input(article_text=args.text, title=args.title, url=args.url)
    article_text = resolved["text"]

    if not article_text:
        print("Error: Article text is empty or could not be extracted.", file=sys.stderr)
        return 1

    print("Generating summary...")
    summary = summarize_article(article_text)
    print_summary_result(summary)
    return 0


def run_credibility_mode(args, include_summary: bool) -> int:
    from credibility_model import analyze_article

    print("Analysing article...")
    try:
        result = analyze_article(
            article_text=args.text,
            title=args.title,
            url=args.url,
            run_summarizer=include_summary,
        )
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print_credibility_result(
        result,
        verbose=args.verbose,
        show_summary=include_summary,
    )

    if args.verbose:
        print("Raw JSON Output:")
        print(json.dumps(result, indent=2))

    return 0


def main():
    args = parse_args()

    if not args.text and not args.url:
        print("Error: Provide --text or --url (or both).", file=sys.stderr)
        sys.exit(1)

    if args.mode == "summary":
        sys.exit(run_summary_mode(args))

    if args.mode == "credibility":
        sys.exit(run_credibility_mode(args, include_summary=False))

    sys.exit(run_credibility_mode(args, include_summary=True))


if __name__ == "__main__":
    main()
