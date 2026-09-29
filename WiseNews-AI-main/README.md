# WiseNews - Credibility Scoring and Summarization

WiseNews supports two separate platform functions:

- **Credibility scoring**: outputs a **Credibility Confidence Score (0-100)** using fine-tuned RoBERTa classification, source credibility lookup, emotional tone analysis, headline quality detection, and content completeness scoring.
- **Summarization**: generates an abstractive article summary using BART.

> The system does **not** label articles as "fake" or "real". It returns a probabilistic, explainable credibility score.

---

## Project Structure

```text
WiseNews/
|-- data/                        # Put Fake.csv and True.csv here
|-- models/                      # Fine-tuned RoBERTa saved here after training
|-- preprocessing/
|   |-- __init__.py
|   `-- text_cleaner.py          # HTML removal, whitespace normalization, truncation
|-- classification/
|   |-- __init__.py
|   `-- credibility_classifier.py  # RoBERTa inference (P_real, P_fake)
|-- scoring/
|   |-- __init__.py
|   |-- emotion_tone.py          # Sensationalism / emotional intensity detector
|   |-- headline_detector.py     # Clickbait and deceptive headline detector
|   `-- completeness.py          # Evidence quality: dates, NER, stats, sources
|-- source/
|   |-- __init__.py
|   `-- source_credibility.py    # Domain -> credibility score lookup
|-- summarization/
|   |-- __init__.py
|   `-- summarizer.py            # BART abstractive summarizer
|-- article_input.py             # Shared URL/text input resolver
|-- train_model.py               # Fine-tune RoBERTa on Fake/True dataset
|-- credibility_model.py         # Credibility inference pipeline
|-- score_engine.py              # Weighted scoring formula
|-- main.py                      # CLI entry point with separate modes
`-- requirements.txt
```

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Prepare the dataset

Download the [Kaggle Fake News Dataset](https://www.kaggle.com/c/fake-news/data) and place:

- `Fake.csv` -> `data/Fake.csv`
- `True.csv` -> `data/True.csv`

### 3. Train the RoBERTa model

```bash
python train_model.py
```

This will:

- Load and split the dataset (70/15/15)
- Fine-tune `roberta-base` for 3 epochs
- Save the model to `models/roberta_wisenews/`

Training takes about 1-2 hours on a GPU, or 6-8 hours on CPU.

---

## Usage

### Credibility scoring only

```bash
python main.py --mode credibility --url "https://apnews.com/article/..."
```

### Summarization only

```bash
python main.py --mode summary --url "https://apnews.com/article/..."
```

### Combined credibility + summary

```bash
python main.py --mode full --url "https://apnews.com/article/..."
```

### Analyze pasted text

```bash
python main.py --mode credibility --title "Scientists discover X" --text "Article body here..."
```

### Verbose credibility output

```bash
python main.py --mode credibility --url "https://..." --verbose
```

---

## Scoring Formula

| Factor | Weight |
|--------|--------|
| Content Score (RoBERTa) | 50 |
| Source Credibility | 25 |
| Content Completeness | 5 |
| Emotional Tone | 10 |
| Deceptive Headline | 10 |

```text
Final Score (0-100) =
    50 x content_score
  + 25 x source_score
  +  5 x completeness_score
  + 10 x emotion_score
  + 10 x headline_score
```

The RoBERTa classifier now exposes:

- `content_score` on a 0-50 scale
- `content_score_normalized` on a 0-1 scale for internal aggregation

---

## Sample Output

```text
====================================================
  WiseNews Credibility Score: 78/100
  [###############.....]  High Credibility
====================================================

Score Breakdown:
  Content (RoBERTa)   : 32.0 / 50
  Source Credibility  : 18.0 / 25
  Content Completeness:  4.0 / 5
  Emotional Tone      :  8.0 / 10
  Headline Quality    :  6.0 / 10

Summary:
  Researchers at MIT announced a new battery technology...
```

---

## Models Used

| Task | Model |
|------|-------|
| Classification | `roberta-base` (fine-tuned) |
| Summarization | `facebook/bart-large-cnn` |
| Named Entity Recognition | `spaCy en_core_web_sm` |

---

## Notes

- The RoBERTa model must be trained before running inference.
- BART summarizer downloads about 1.6 GB on first use.
- Credibility scoring and summarization can now run independently through `--mode credibility` and `--mode summary`.
- `analyze_article()` defaults to credibility-only behavior; summarization is opt-in.
- The source credibility dictionary covers about 50 domains; unknown domains default to `0.5`.
- All scoring is explainable because each factor score is returned individually.
