"""
train_model.py
Fine-tunes roberta-base on the Kaggle Fake/True news dataset.

Expected data layout:
  data/Fake.csv  - columns: title, text, subject, date
  data/True.csv  - columns: title, text, subject, date

Run:
  python train_model.py
"""

import os

import pandas as pd
import torch
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from torch.optim import AdamW
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm
from transformers import (
    RobertaForSequenceClassification,
    RobertaTokenizer,
    get_linear_schedule_with_warmup,
)

from preprocessing.text_cleaner import combine_title_and_text

# Config
MODEL_NAME = "roberta-base"
MAX_LEN = 512
BATCH_SIZE = 8
EPOCHS = 4
LR = 2e-5
WEIGHT_DECAY = 0.01
LABEL_SMOOTHING = 0.05
MAX_GRAD_NORM = 1.0
EARLY_STOPPING_PATIENCE = 2
SAVE_PATH = "models/roberta_wisenews"
FAKE_CSV = "data/Fake.csv"
TRUE_CSV = "data/True.csv"

ID2LABEL = {0: "fake", 1: "real"}
LABEL2ID = {"fake": 0, "real": 1}


class NewsDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label": torch.tensor(self.labels[idx], dtype=torch.long),
        }


def load_data():
    print("Loading datasets...")
    fake_df = pd.read_csv(FAKE_CSV)
    true_df = pd.read_csv(TRUE_CSV)

    fake_df["label"] = LABEL2ID["fake"]
    true_df["label"] = LABEL2ID["real"]

    df = pd.concat([fake_df, true_df], ignore_index=True)
    df = df.dropna(subset=["title", "text"])

    df["combined"] = df.apply(
        lambda row: combine_title_and_text(row["title"], row["text"]),
        axis=1,
    )
    df["combined"] = df["combined"].str[:3000]

    print(
        f"Total samples: {len(df)}  |  "
        f"Fake: {(df.label == LABEL2ID['fake']).sum()}  |  "
        f"Real: {(df.label == LABEL2ID['real']).sum()}"
    )
    return df["combined"].tolist(), df["label"].tolist()


def evaluate(model, loader, device, criterion):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in loader:
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)

            outputs = model(ids, attention_mask=mask)
            loss = criterion(outputs.logits, labels)
            preds = outputs.logits.argmax(dim=-1)

            total_loss += loss.item()
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.cpu().tolist())

    precision, recall, f1, _ = precision_recall_fscore_support(
        all_labels,
        all_preds,
        average="binary",
        pos_label=LABEL2ID["real"],
        zero_division=0,
    )

    return {
        "loss": total_loss / max(1, len(loader)),
        "accuracy": accuracy_score(all_labels, all_preds),
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    tokenizer = RobertaTokenizer.from_pretrained(MODEL_NAME)
    model = RobertaForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=2,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    model.to(device)

    texts, labels = load_data()

    X_train, X_temp, y_train, y_temp = train_test_split(
        texts,
        labels,
        test_size=0.30,
        random_state=42,
        stratify=labels,
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=0.50,
        random_state=42,
        stratify=y_temp,
    )

    train_ds = NewsDataset(X_train, y_train, tokenizer, MAX_LEN)
    val_ds = NewsDataset(X_val, y_val, tokenizer, MAX_LEN)
    test_ds = NewsDataset(X_test, y_test, tokenizer, MAX_LEN)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE)

    optimizer = AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING)
    total_training_steps = len(train_loader) * EPOCHS
    warmup_steps = max(1, int(0.1 * total_training_steps))
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_training_steps,
    )

    best_val_f1 = -1.0
    epochs_without_improvement = 0

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        loop = tqdm(train_loader, desc=f"Epoch {epoch}/{EPOCHS}")

        for batch in loop:
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            labels_batch = batch["label"].to(device)

            optimizer.zero_grad()
            outputs = model(ids, attention_mask=mask)
            loss = criterion(outputs.logits, labels_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD_NORM)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            loop.set_postfix(loss=loss.item())

        train_loss = total_loss / max(1, len(train_loader))
        val_metrics = evaluate(model, val_loader, device, criterion)

        print(
            f"Epoch {epoch} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_metrics['loss']:.4f} | "
            f"Val Acc: {val_metrics['accuracy']:.4f} | "
            f"Val Precision: {val_metrics['precision']:.4f} | "
            f"Val Recall: {val_metrics['recall']:.4f} | "
            f"Val F1: {val_metrics['f1']:.4f}"
        )

        if val_metrics["f1"] > best_val_f1:
            best_val_f1 = val_metrics["f1"]
            epochs_without_improvement = 0
            os.makedirs(SAVE_PATH, exist_ok=True)
            model.save_pretrained(SAVE_PATH)
            tokenizer.save_pretrained(SAVE_PATH)
            print(f"Saved new best model to {SAVE_PATH}")
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= EARLY_STOPPING_PATIENCE:
                print("Early stopping triggered.")
                break

    best_model = RobertaForSequenceClassification.from_pretrained(SAVE_PATH)
    best_model.to(device)

    test_metrics = evaluate(best_model, test_loader, device, criterion)
    print(
        "\nTest Metrics | "
        f"Loss: {test_metrics['loss']:.4f} | "
        f"Acc: {test_metrics['accuracy']:.4f} | "
        f"Precision: {test_metrics['precision']:.4f} | "
        f"Recall: {test_metrics['recall']:.4f} | "
        f"F1: {test_metrics['f1']:.4f}"
    )


if __name__ == "__main__":
    train()
