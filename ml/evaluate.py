import pandas as pd
import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from sklearn.model_selection import train_test_split

PROCESSED = os.path.join(os.path.dirname(__file__), '../data/processed')
MODELS = os.path.join(os.path.dirname(__file__), '../models')
FIGURES = os.path.join(os.path.dirname(__file__), '../outputs/figures')

def evaluate():
    df = pd.read_csv(os.path.join(PROCESSED, 'jobs_clean.csv'))
    X = df['job_skills']
    y = df['job_title_short']

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    with open(os.path.join(MODELS, 'tfidf_vectorizer.pkl'), 'rb') as f:
        vectorizer = pickle.load(f)
    with open(os.path.join(MODELS, 'logistic_classifier.pkl'), 'rb') as f:
        model = pickle.load(f)

    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)

    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred))

    labels = sorted(y.unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=labels, yticklabels=labels,
                cmap='Blues', ax=ax)
    ax.set_xlabel('Predicted')
    ax.set_ylabel('Actual')
    ax.set_title('Job Title Classifier — Confusion Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(FIGURES, 'classifier_confusion_matrix.png'), dpi=150)
    print(f"Confusion matrix saved to outputs/figures/")

if __name__ == '__main__':
    evaluate()
