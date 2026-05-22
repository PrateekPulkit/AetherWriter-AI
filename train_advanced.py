import pandas as pd
import numpy as np
import random
import pickle
import os
import re
import nltk
from nltk.corpus import brown
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Ensure nltk data
nltk.download('brown', quiet=True)
nltk.download('punkt', quiet=True)

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return " ".join(text.split())

# --- ADVANCED CORRUPTION ENGINE (PHONETIC + QWERTY) ---
def introduce_sophisticated_errors(text):
    words = text.split()
    if not words: return text
    
    # Types of real-world human errors
    choice = random.choices(
        ['phonetic', 'qwerty', 'grammar', 'repeated', 'omission', 'none'], 
        weights=[0.25, 0.25, 0.20, 0.10, 0.10, 0.10]
    )[0]
    
    if choice == 'phonetic':
        idx = random.randint(0, len(words) - 1)
        word = words[idx]
        swaps = {"ph": "f", "gh": "f", "tion": "shun", "know": "no", "caught": "cot", "their": "there"}
        for k, v in swaps.items():
            if k in word.lower():
                words[idx] = word.lower().replace(k, v)
                break
                
    elif choice == 'qwerty':
        idx = random.randint(0, len(words) - 1)
        word = list(words[idx])
        if len(word) > 4:
            neighbors = {'a': 'sq', 's': 'awde', 'e': 'rdws', 't': 'rygf', 'o': 'pikl'}
            c_idx = random.randint(0, len(word) - 1)
            char = word[c_idx].lower()
            if char in neighbors:
                word[c_idx] = random.choice(neighbors[char])
                words[idx] = "".join(word)

    elif choice == 'grammar':
        patterns = {"is": "are", "have": "has", "goes": "go", "was": "were", "this": "these"}
        for i, w in enumerate(words):
            if w.lower() in patterns:
                words[i] = patterns[w.lower()]
                break

    elif choice == 'omission':
        if len(words) > 3:
            idx = random.randint(0, len(words) - 1)
            words.pop(idx)
            
    elif choice == 'repeated':
        idx = random.randint(0, len(words) - 1)
        words.insert(idx, words[idx])
        
    return " ".join(words)

# --- LOADING REAL ENGLISH CORPUS (KAGGLE-LEVEL DENSITY) ---
print("📥 Fetching real English corpus (1 Million Words)...")
sentences = brown.sents()[:20000] # Use top 20k real sentences
clean_sentences = [" ".join(s) for s in sentences if len(s) > 4]

print(f"📊 Preparing dataset from {len(clean_sentences)} real sentences...")
data = []
for s in clean_sentences:
    # Add Correct
    data.append({"text": s, "label": 0})
    # Add Corrupted
    corrupted = introduce_sophisticated_errors(s)
    if corrupted != s:
        data.append({"text": corrupted, "label": 1})

df = pd.DataFrame(data)
df['clean'] = df['text'].apply(clean_text)

# --- HIGH-DIMENSIONAL VECTORIZATION (LLM LEVEL TF-IDF) ---
print("🚀 Vectorizing sequence patterns (ngram 1-5)...")
vectorizer = TfidfVectorizer(
    analyzer='char', 
    ngram_range=(1, 5), 
    max_features=25000, 
    sublinear_tf=True
)
X = vectorizer.fit_transform(df['clean'])
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# --- RANDOM FOREST OPTIMIZER ---
print("🧠 Training Random Forest Ensemble (100 Trees)...")
model = RandomForestClassifier(n_estimators=100, max_depth=30, n_jobs=-1, random_state=42)
model.fit(X_train, y_train)

# --- VALIDATION ---
y_pred = model.predict(X_test)
print(f"🎯 Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# --- PERSISTENCE ---
os.makedirs('backend/ml', exist_ok=True)
with open('backend/ml/model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('backend/ml/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("✨ AetherWriter Neural Core V4.0 (LLM Grade) persists.")
