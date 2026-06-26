import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

PROCESSED = os.path.join(os.path.dirname(__file__), '../data/processed')
MODELS = os.path.join(os.path.dirname(__file__), '../models')

def train():
    df = pd.read_csv(os.path.join(PROCESSED, 'resumes_clean.csv'))
    df = df.dropna(subset=['Resume_str', 'Category'])

    X = df['Resume_str']
    y = df['Category']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Fit vectorizer on resumes + O*NET profiles so both share the same vocabulary
    onet = pd.read_csv(os.path.join(PROCESSED, 'onet_profiles.csv'))
    onet_text = onet['profile_text'].dropna()
    combined_corpus = pd.concat([X_train, onet_text], ignore_index=True)

    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    vectorizer.fit(combined_corpus)
    X_train_tfidf = vectorizer.transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_tfidf, y_train)

    y_pred = model.predict(X_test_tfidf)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred))

    os.makedirs(MODELS, exist_ok=True)
    with open(os.path.join(MODELS, 'tfidf_vectorizer.pkl'), 'wb') as f:
        pickle.dump(vectorizer, f)
    with open(os.path.join(MODELS, 'logistic_classifier.pkl'), 'wb') as f:
        pickle.dump(model, f)

    print("Models saved to models/")

if __name__ == '__main__':
    train()
