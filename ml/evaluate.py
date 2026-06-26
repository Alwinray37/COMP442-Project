import pandas as pd
import pickle
import os
import sys
from pathlib import Path
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from sklearn.model_selection import train_test_split

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import (
    CACHE_DIR,
    FIGURE_DIR,
    LOGISTIC_CLASSIFIER_PATH,
    RESUMES_CLEAN_CSV,
    TFIDF_VECTORIZER_PATH,
)

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import seaborn as sns

def evaluate():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(RESUMES_CLEAN_CSV)
    df = df.dropna(subset=['Resume_str', 'Category'])
    X = df['Resume_str']
    y = df['Category']

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    with open(TFIDF_VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
    with open(LOGISTIC_CLASSIFIER_PATH, 'rb') as f:
        model = pickle.load(f)

    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)

    accuracy = accuracy_score(y_test, y_pred)
    report_text = classification_report(y_test, y_pred, zero_division=0)
    report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    print(f"Accuracy: {accuracy:.4f}")
    print(report_text)

    with open(FIGURE_DIR / 'classifier_report.txt', 'w') as f:
        f.write(f"Accuracy: {accuracy:.4f}\n\n")
        f.write(report_text)
    pd.DataFrame(report_dict).transpose().to_csv(FIGURE_DIR / 'classifier_report.csv')

    labels = sorted(y.unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=labels, yticklabels=labels,
                cmap='Blues', ax=ax)
    ax.set_xlabel('Predicted')
    ax.set_ylabel('Actual')
    ax.set_title('Resume Category Classifier — Confusion Matrix')
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / 'classifier_confusion_matrix.png', dpi=150)
    print(f"Confusion matrix saved to outputs/figures/")

if __name__ == '__main__':
    evaluate()
