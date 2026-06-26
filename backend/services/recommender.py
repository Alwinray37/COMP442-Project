import pickle
import re
import sys
from pathlib import Path
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

sys.path.append(str(Path(__file__).resolve().parents[2]))

from project_paths import LOGISTIC_CLASSIFIER_PATH, ONET_PROFILES_CSV, TFIDF_VECTORIZER_PATH

_vectorizer = None
_classifier = None
_onet_profiles = None
_onet_tfidf = None

# Maps resume categories to O*NET SOC major group prefixes
CATEGORY_SOC_MAP = {
    'ACCOUNTANT':           ['13'],
    'ADVOCATE':             ['23'],
    'AGRICULTURE':          ['45'],
    'APPAREL':              ['51', '27'],
    'ARTS':                 ['27', '25'],
    'AUTOMOBILE':           ['49', '51'],
    'AVIATION':             ['53'],
    'BANKING':              ['13', '43'],
    'BPO':                  ['43', '13'],
    'BUSINESS-DEVELOPMENT': ['11', '13'],
    'CHEF':                 ['35'],
    'CONSTRUCTION':         ['47', '17'],
    'CONSULTANT':           ['13', '11'],
    'DESIGNER':             ['27'],
    'DIGITAL-MEDIA':        ['27', '15'],
    'ENGINEERING':          ['17', '15'],
    'FINANCE':              ['13'],
    'FITNESS':              ['29', '39'],
    'HEALTHCARE':           ['29', '31'],
    'HR':                   ['13', '43'],
    'INFORMATION-TECHNOLOGY': ['15'],
    'PUBLIC-RELATIONS':     ['27', '13'],
    'SALES':                ['41'],
    'TEACHER':              ['25'],
}


def _load_models():
    global _vectorizer, _classifier, _onet_profiles, _onet_tfidf
    if _vectorizer is None:
        with open(TFIDF_VECTORIZER_PATH, 'rb') as f:
            _vectorizer = pickle.load(f)
        with open(LOGISTIC_CLASSIFIER_PATH, 'rb') as f:
            _classifier = pickle.load(f)
    if _onet_profiles is None:
        _onet_profiles = pd.read_csv(ONET_PROFILES_CSV)
        _onet_tfidf = _vectorizer.transform(_onet_profiles['profile_text'].fillna(''))


def _clean(text):
    return re.sub(r'\W+', ' ', text.lower()).strip()


def predict_job_titles(user_text, top_k=10, category_count=3, confidence_threshold=0.45, candidate_ratio=0.75):
    _load_models()
    text_clean = _clean(user_text)
    tfidf = _vectorizer.transform([text_clean])

    # Stage 1 — predict broad category
    probs = _classifier.predict_proba(tfidf)[0]
    ranked_category_indices = probs.argsort()[::-1]
    category = _classifier.classes_[ranked_category_indices[0]]
    category_confidence = float(probs[ranked_category_indices[0]])
    category_candidates = [
        {
            "category": _classifier.classes_[i],
            "confidence": round(float(probs[i]), 4),
        }
        for i in ranked_category_indices[:category_count]
    ]

    # Stage 2 — filter O*NET to likely SOC groups, rank by cosine similarity
    categories_for_matching = [category]
    if category_confidence < confidence_threshold:
        categories_for_matching = [
            item["category"]
            for item in category_candidates
            if item["confidence"] >= round(category_confidence * candidate_ratio, 4)
        ]

    soc_prefixes = sorted({
        prefix
        for candidate in categories_for_matching
        for prefix in CATEGORY_SOC_MAP.get(candidate, [])
    })
    if soc_prefixes:
        mask = _onet_profiles['O*NET-SOC Code'].str[:2].isin(soc_prefixes)
        subset_profiles = _onet_profiles[mask].reset_index(drop=True)
        subset_tfidf = _onet_tfidf[_onet_profiles[mask].index]
    else:
        subset_profiles = _onet_profiles
        subset_tfidf = _onet_tfidf

    if subset_profiles.empty:
        subset_profiles = _onet_profiles
        subset_tfidf = _onet_tfidf

    sims = cosine_similarity(tfidf, subset_tfidf)[0]
    top_indices = sims.argsort()[-top_k:][::-1]

    return {
        "category": category,
        "category_confidence": round(category_confidence, 4),
        "category_candidates": category_candidates,
        "matches": [
            {
                "soc_code": subset_profiles.iloc[i]['O*NET-SOC Code'],
                "job_title": subset_profiles.iloc[i]['Title'],
                "score": round(float(sims[i]), 4),
            }
            for i in top_indices
        ]
    }
