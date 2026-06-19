# COMP442 Project

Job title recommender system for COMP442. Given a user's resume or inputted skills and experience, the model recommends the most suitable job titles.

## Project Structure

```text
COMP442-Project/
  data/
    raw/                    # original datasets, never modified
    processed/              # cleaned outputs from preprocessing
  ml/
    preprocess.py           # cleans data and saves to data/processed/
    train_classifier.py     # trains TF-IDF + Logistic Regression, saves to models/
    evaluate.py             # accuracy, classification report, confusion matrix
    create_visualizations.py
    create_correlation_analysis.py
    create_missingness_chart.py
    create_resume_histogram.py
  models/                   # saved .pkl model artifacts (git-ignored)
  notebooks/                # Jupyter notebooks for EDA
  backend/
    app.py                  # Flask API
    services/
      recommender.py        # loads saved models, runs predictions
      resume_parser.py      # parses PDF and text resumes
  frontend/
    src/
      pages/
      components/
  outputs/
    figures/                # generated charts and visualizations
  requirements.txt
```

## Data

Raw datasets go in `data/raw/` and are never modified.

- `data/raw/Resume.csv` — 2,484 labeled resumes across 24 job categories
- `data/raw/job_postings.csv` — original LinkedIn job postings (unused after HuggingFace migration)
- `data/raw/Occupation Data.xlsx` — O*NET occupation classifications
- `data/raw/Software Skills.xlsx` — O*NET software skills by occupation
- `data/raw/Transferable Skills.xlsx` — O*NET soft skills by occupation

The primary job postings data is now sourced from the HuggingFace dataset `lukebarousse/data_jobs` (785,741 postings with 10 standardized job title labels). It is downloaded automatically during preprocessing.

## ML Pipeline

Run these in order:

**1. Preprocess**
```bash
python ml/preprocess.py
```
Cleans the resume dataset and downloads/cleans the HuggingFace jobs dataset. Outputs saved to `data/processed/`.

**2. Train**
```bash
python ml/train_classifier.py
```
Trains a TF-IDF vectorizer and Logistic Regression classifier on job skills → job title. Saves `tfidf_vectorizer.pkl` and `logistic_classifier.pkl` to `models/`.

**3. Evaluate**
```bash
python ml/evaluate.py
```
Prints accuracy and classification report. Saves confusion matrix to `outputs/figures/`.

## Backend

The Flask API loads the saved models and serves predictions. It does not retrain on startup.

Endpoints:
- `GET /status` — health check
- `POST /api/match` — accepts PDF or JSON resume, returns top 5 job title recommendations with confidence scores

Run the backend (models must be trained first):
```bash
cd backend
../.venv/bin/python app.py
```

Runs at `http://127.0.0.1:5000`.

## Frontend

React + Vite app with resume intake UI (PDF upload and manual skill/experience entry).

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

## Generate Visualizations

```bash
python ml/create_visualizations.py
python ml/create_correlation_analysis.py
python ml/create_missingness_chart.py
```

Outputs saved to `outputs/figures/`.

## Notes

- Raw data files and trained models are git-ignored.
- The HuggingFace dataset requires `huggingface_hub` to be installed.
- Frontend and backend API connection is in progress.
