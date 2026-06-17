from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

RESUME_CSV = RAW_DATA_DIR / "Resume.csv"
RESUMES_CSV = RAW_DATA_DIR / "resumes.csv"
JOB_POSTINGS_CSV = RAW_DATA_DIR / "job_postings.csv"

OUTPUT_DIR = ROOT_DIR / "outputs"
DIAGRAM_DIR = OUTPUT_DIR / "diagrams"
FIGURE_DIR = OUTPUT_DIR / "figures"
CACHE_DIR = ROOT_DIR / ".cache"
