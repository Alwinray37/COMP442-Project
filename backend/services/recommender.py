import pickle
import os
import re

MODELS = os.path.join(os.path.dirname(__file__), '../../models')

_vectorizer = None
_classifier = None

def _load_models():
    global _vectorizer, _classifier
    if _vectorizer is None:
        with open(os.path.join(MODELS, 'tfidf_vectorizer.pkl'), 'rb') as f:
            _vectorizer = pickle.load(f)
        with open(os.path.join(MODELS, 'logistic_classifier.pkl'), 'rb') as f:
            _classifier = pickle.load(f)

def predict_job_titles(user_text, top_k=5):
    _load_models()
    text_clean = re.sub(r'\W+', ' ', user_text.lower()).strip()
    tfidf = _vectorizer.transform([text_clean])
    probs = _classifier.predict_proba(tfidf)[0]
    classes = _classifier.classes_
    top_indices = probs.argsort()[-top_k:][::-1]
    return [
        {"job_title": classes[i], "confidence": round(float(probs[i]), 4)}
        for i in top_indices
    ]
