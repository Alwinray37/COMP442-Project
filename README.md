# COMP442 Project

COMP442 ML class project -- Job recommender system. User uploads resume or inputs experience and education items, skills and interests, and our program will recommend job titles which best fit their background.

## How It Works

The system is built on a two-stage pipeline.

1. **Data Collection & Preprocessing**
We sourced a dataset of 2,484 labeled resumes across 24 broad job categories including Healthcare, Finance, Engineering, Education, Sales, Arts, and more. The resume text is cleaned — lowercased, punctuation removed — and duplicate records are dropped before training. Separately, O\*NET occupation profiles are built by combining skills, knowledge, abilities, work activities, and work styles into one text document per occupation.

2. **Feature Extraction**
Each resume and occupation profile is converted into a numerical representation using TF-IDF (Term Frequency–Inverse Document Frequency). This captures which words and phrases are most significant relative to the entire dataset, turning raw text into a vector the model can learn from.

3. **Model Training**
A Logistic Regression classifier is trained on the TF-IDF resume vectors using the 24 job category labels as targets. Training uses an 80/20 train-test split and is evaluated using accuracy and a classification report.

4. **Occupation Matching with O\*NET**
When a new resume is submitted, the classifier predicts its broad job category. The system then computes cosine similarity between the resume vector and all O\*NET occupation profiles within that category to surface the most relevant specific job titles.

5. **User Interface**
Users interact through a React web application where they can either upload a PDF resume or manually enter their skills, experience, and education. The frontend sends the input to a Flask REST API, which runs it through the trained model and returns a ranked list of job title recommendations.

## Project Structure

```text
COMP442-Project/
  data/
    raw/                    # original datasets, never modified
    processed/              # cleaned outputs from preprocessing
  ml/
    preprocess.py           # cleans Resume.csv and builds O*NET profiles
    train_classifier.py     # trains TF-IDF + Logistic Regression, saves to models/
    evaluate.py             # accuracy, classification report, confusion matrix
    create_visualizations.py
    create_correlation_analysis.py
    create_missingness_chart.py
    create_resume_histogram.py
  models/                   # saved .pkl model artifacts
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

- `data/raw/Resume.csv` — 2,484 labeled resumes across 24 job categories (classifier training data)
- `data/raw/Occupation Data.xlsx` — O\*NET occupation titles and SOC codes
- `data/raw/Essential Skills.xlsx` — core skills per occupation
- `data/raw/Knowledge.xlsx` — knowledge domains per occupation
- `data/raw/Abilities.xlsx` — required abilities per occupation
- `data/raw/Work Activities.xlsx` — day-to-day tasks per occupation
- `data/raw/Work Styles.xlsx` — personality and work style traits per occupation
- `data/raw/Software Skills.xlsx` — O\*NET software skills by occupation

## ML Pipeline

Run these in order:

**1. Preprocess**
```bash
python ml/preprocess.py
```
Cleans `Resume.csv` and builds O\*NET occupation profiles from the xlsx files. Outputs saved to `data/processed/`.

**2. Train**
```bash
python ml/train_classifier.py
```
Trains a TF-IDF vectorizer and Logistic Regression classifier on resume text → job category. Saves `tfidf_vectorizer.pkl` and `logistic_classifier.pkl` to `models/`.

**3. Evaluate**
```bash
python ml/evaluate.py
```
Prints accuracy and classification report. Saves confusion matrix to `outputs/figures/`.

## Backend

The Flask API loads the saved models and serves predictions. It does not retrain on startup.

Endpoints:
- `GET /status` — health check
- `POST /api/match` — accepts PDF or JSON resume, returns top job title recommendations

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
- Frontend and backend API connection is in progress.
