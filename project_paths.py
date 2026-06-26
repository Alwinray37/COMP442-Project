from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

DATA_DIR = ROOT_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

RESUME_CSV = RAW_DATA_DIR / "Resume.csv"
RESUMES_CLEAN_CSV = PROCESSED_DATA_DIR / "resumes_clean.csv"
ONET_PROFILES_CSV = PROCESSED_DATA_DIR / "onet_profiles.csv"
JOB_POSTINGS_CSV = RAW_DATA_DIR / "job_postings.csv"

ONET_OCCUPATION_XLSX = RAW_DATA_DIR / "Occupation Data.xlsx"
ONET_PROFILE_FILES = [
    RAW_DATA_DIR / "Essential Skills.xlsx",
    RAW_DATA_DIR / "Knowledge.xlsx",
    RAW_DATA_DIR / "Abilities.xlsx",
    RAW_DATA_DIR / "Work Activities.xlsx",
    RAW_DATA_DIR / "Work Styles.xlsx",
]

MODELS_DIR = ROOT_DIR / "models"
TFIDF_VECTORIZER_PATH = MODELS_DIR / "tfidf_vectorizer.pkl"
LOGISTIC_CLASSIFIER_PATH = MODELS_DIR / "logistic_classifier.pkl"

OUTPUT_DIR = ROOT_DIR / "outputs"
FIGURE_DIR = OUTPUT_DIR / "figures"
DIAGRAM_DIR = OUTPUT_DIR / "diagrams"
CACHE_DIR = ROOT_DIR / ".cache"
