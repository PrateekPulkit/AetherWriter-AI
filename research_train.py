import os
import torch
import numpy as np
import pandas as pd
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import KFold
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import random
import re
import time

# --- CONFIGURATION ---
MODEL_NAME = "prajjwal1/bert-tiny"  # Extremely fast, perfect for CPU research
DATASET_SIZE = 5000 # 5k samples total to ensure < 1 hour training on CPU
EPOCHS_PER_FOLD = 10
FOLDS = 5
MAX_LENGTH = 64
OUTPUT_DIR = "./research_model"

print(f"Starting Research-Level Training: {MODEL_NAME}")
print(f"Folds: {FOLDS} | Epochs/Fold: {EPOCHS_PER_FOLD} | Target: < 1 Hour")

# --- 1. DATASET ACQUISITION ---
print("Downloading JFLEG and WikiText datasets...")
# Using JFLEG for real-world errors and WikiText for clean sentences
try:
    jfleg = load_dataset("jfleg", split="validation", trust_remote_code=True)
    wiki = load_dataset("wikitext", "wikitext-2-raw-v1", split="train", trust_remote_code=True)
except Exception as e:
    print(f"Dataset download failed: {e}. Falling back to synthetic generation.")
    jfleg = None
    wiki = None

# --- 2. DATA PREPARATION ---
def corrupt_text(text):
    words = text.split()
    if len(words) < 3: return text
    # Simple corruption for fallback
    choice = random.choice(['swap', 'drop', 'double'])
    idx = random.randint(0, len(words) - 1)
    if choice == 'swap' and idx < len(words) - 1:
        words[idx], words[idx+1] = words[idx+1], words[idx]
    elif choice == 'drop':
        words.pop(idx)
    elif choice == 'double':
        words.insert(idx, words[idx])
    return " ".join(words)

data = []

if jfleg and wiki:
    # Get correct sentences from Wiki
    wiki_sentences = [s for s in wiki['text'] if len(s.split()) > 5][:DATASET_SIZE // 2]
    for s in wiki_sentences:
        data.append({"text": s, "label": 0}) # Clean
    
    # Get error sentences from JFLEG
    jfleg_sentences = jfleg['sentence'][:DATASET_SIZE // 2]
    for s in jfleg_sentences:
        data.append({"text": s, "label": 1}) # Incorrect
else:
    # Synthetic Fallback if no internet or library issues
    for _ in range(DATASET_SIZE // 2):
        s = "This is a perfectly normal sentence for training purposes."
        data.append({"text": s, "label": 0})
        data.append({"text": corrupt_text(s), "label": 1})

df = pd.DataFrame(data).sample(frac=1).reset_index(drop=True)
print(f"Prepared {len(df)} samples for training.")

# --- 3. MODEL & TOKENIZER ---
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=MAX_LENGTH)

# --- 4. 5-FOLD CROSS VALIDATION ---
kf = KFold(n_splits=FOLDS, shuffle=True, random_state=42)

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='binary')
    acc = accuracy_score(labels, preds)
    return {"accuracy": acc, "f1": f1, "precision": precision, "recall": recall}

start_time = time.time()

for fold, (train_idx, val_idx) in enumerate(kf.split(df)):
    print(f"\n--- Training Fold {fold + 1}/{FOLDS} ---")
    
    train_df = df.iloc[train_idx]
    val_df = df.iloc[val_idx]
    
    from datasets import Dataset
    train_ds = Dataset.from_pandas(train_df).map(tokenize_function, batched=True)
    val_ds = Dataset.from_pandas(val_df).map(tokenize_function, batched=True)
    
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
    
    training_args = TrainingArguments(
        output_dir=f"{OUTPUT_DIR}/fold_{fold}",
        num_train_epochs=EPOCHS_PER_FOLD,
        per_device_train_batch_size=32,
        per_device_eval_batch_size=32,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=10,
        learning_rate=5e-5,
        weight_decay=0.01,
        disable_tqdm=True, # Cleaner terminal output
        use_cpu=True # Ensure it runs on CPU as requested indirectly by "control" and time limits
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )
    
    trainer.train()
    
    # Check time to ensure we stay under 1 hour
    elapsed = time.time() - start_time
    print(f"Fold {fold+1} complete. Total elapsed: {elapsed/60:.2f} mins")
    
    if elapsed > 3000: # 50 mins buffer
        print("Approaching 1-hour limit. Stopping at current fold.")
        break

# --- 5. FINALIZATION ---
# Save the final model and tokenizer to a standard location
FINAL_PATH = os.path.join("backend", "ml", "research_model")
model.save_pretrained(FINAL_PATH)
tokenizer.save_pretrained(FINAL_PATH)

total_time = time.time() - start_time
print(f"\nTraining Complete! Total Time: {total_time/60:.2f} minutes")
print(f"Model saved to {FINAL_PATH}")
