"""
classification/credibility_classifier.py
Loads the fine-tuned RoBERTa model and returns P(real), P(fake) for an article.
"""

import torch
import torch.nn.functional as F
from transformers import RobertaForSequenceClassification, RobertaTokenizer

MODEL_PATH = "models/roberta_wisenews"
MAX_LEN = 512
CHUNK_OVERLAP = 64
INFERENCE_BATCH_SIZE = 8

# Module-level cache so model is loaded only once per process
_tokenizer = None
_model = None
_device = None


def _load_model():
    global _tokenizer, _model, _device
    if _model is None:
        print(f"Loading RoBERTa model from {MODEL_PATH} ...")
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _tokenizer = RobertaTokenizer.from_pretrained(MODEL_PATH)
        _model = RobertaForSequenceClassification.from_pretrained(MODEL_PATH)
        _model.to(_device)
        _model.eval()
        print("Model loaded.")
    return _tokenizer, _model, _device


def _split_combined_text(combined_text: str) -> tuple[str, str]:
    if " [SEP] " in combined_text:
        return combined_text.split(" [SEP] ", 1)
    return "", combined_text


def _encode_without_truncation(tokenizer, text: str) -> list[int]:
    return tokenizer(
        text,
        add_special_tokens=False,
        truncation=False,
        return_attention_mask=False,
        return_token_type_ids=False,
        verbose=False,
    )["input_ids"]


def _build_chunk_windows(tokenizer, combined_text: str) -> list[list[int]]:
    max_content_tokens = MAX_LEN - 2
    title, body = _split_combined_text(combined_text)

    if title:
        prefix_tokens = _encode_without_truncation(tokenizer, f"{title} [SEP] ")
        if len(prefix_tokens) > max_content_tokens - 32:
            prefix_tokens = prefix_tokens[: max_content_tokens - 32]
        body_tokens = _encode_without_truncation(tokenizer, body)
        body_window = max(32, max_content_tokens - len(prefix_tokens))
        step = max(1, body_window - CHUNK_OVERLAP)

        if not body_tokens:
            return [prefix_tokens[:max_content_tokens]]

        windows = []
        for start in range(0, len(body_tokens), step):
            chunk_tokens = prefix_tokens + body_tokens[start : start + body_window]
            windows.append(chunk_tokens[:max_content_tokens])
            if start + body_window >= len(body_tokens):
                break
        return windows

    tokens = _encode_without_truncation(tokenizer, body)
    if not tokens:
        return [[]]

    step = max(1, max_content_tokens - CHUNK_OVERLAP)
    windows = []
    for start in range(0, len(tokens), step):
        windows.append(tokens[start : start + max_content_tokens])
        if start + max_content_tokens >= len(tokens):
            break
    return windows


def _prepare_batch(tokenizer, token_windows: list[list[int]], device):
    input_rows = []
    mask_rows = []
    cls_token_id = tokenizer.cls_token_id
    sep_token_id = tokenizer.sep_token_id
    pad_token_id = tokenizer.pad_token_id

    if cls_token_id is None or sep_token_id is None or pad_token_id is None:
        raise ValueError("Tokenizer is missing required special token IDs for RoBERTa inference.")

    for window in token_windows:
        input_ids = [cls_token_id] + window + [sep_token_id]
        attention_mask = [1] * len(input_ids)
        pad_len = MAX_LEN - len(input_ids)
        input_ids += [pad_token_id] * pad_len
        attention_mask += [0] * pad_len
        input_rows.append(input_ids)
        mask_rows.append(attention_mask)

    return (
        torch.tensor(input_rows, dtype=torch.long, device=device),
        torch.tensor(mask_rows, dtype=torch.long, device=device),
    )


def _to_weighted_content_score(p_real: float) -> float:
    """Convert a normalized credibility probability into the 50-point content scale."""
    bounded_probability = max(0.0, min(1.0, p_real))
    return round(bounded_probability * 50, 2)


def predict_credibility(combined_text: str) -> dict:
    """
    Run RoBERTa inference on combined_text.

    Returns:
        {
            "p_real": float,   # probability article is real (0-1)
            "p_fake": float,   # probability article is fake (0-1)
            "content_score": float,  # content score on a 50-point scale
            "content_score_normalized": float,  # normalized score used by scoring engine
        }
    """
    tokenizer, model, device = _load_model()

    token_windows = _build_chunk_windows(tokenizer, combined_text)
    chunk_logits = []

    with torch.no_grad():
        for start in range(0, len(token_windows), INFERENCE_BATCH_SIZE):
            batch_windows = token_windows[start : start + INFERENCE_BATCH_SIZE]
            input_ids, attention_mask = _prepare_batch(tokenizer, batch_windows, device)
            logits = model(input_ids, attention_mask=attention_mask).logits
            chunk_logits.append(logits.cpu())

    logits = torch.cat(chunk_logits, dim=0)
    aggregated_logits = logits.mean(dim=0)
    probs = F.softmax(aggregated_logits, dim=-1).tolist()

    # label 0 = fake, label 1 = real
    p_fake, p_real = probs[0], probs[1]

    return {
        "p_real": round(p_real, 4),
        "p_fake": round(p_fake, 4),
        "content_score": _to_weighted_content_score(p_real),
        "content_score_normalized": round(p_real, 4),
        "num_chunks": len(token_windows),
    }
