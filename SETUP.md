# Getting Started

Instructions for teammates getting up to speed on the project.

---

## Prerequisites

- Python 3.x
- Node.js
- The raw data files in `data/raw/` — these are git-ignored, get them from a teammate if you don't have them:
  - `Resume.csv`
  - `Occupation Data.xlsx`
  - `Essential Skills.xlsx`
  - `Knowledge.xlsx`
  - `Abilities.xlsx`
  - `Work Activities.xlsx`
  - `Work Styles.xlsx`

---

## First-Time Setup

**1. Pull the branch**
```bash
git fetch origin
git checkout backend-ml
```

**2. Create and activate the virtual environment**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

**4. Run the ML pipeline (order matters)**
```bash
# Clean Resume.csv and build O*NET occupation profiles
python ml/preprocess.py

# Train the TF-IDF vectorizer and Logistic Regression classifier
python ml/train_classifier.py
```

This saves `tfidf_vectorizer.pkl` and `logistic_classifier.pkl` to `models/`. You only need to do this once — the backend loads these files on startup.

> **Note:** If you pulled the branch and `models/` already contains the `.pkl` files, you can skip step 4 entirely.

---

## Running the App

The backend must be running for the frontend to work. Open two terminals:

**Terminal 1 — Backend**
```bash
source .venv/bin/activate
cd backend
python app.py
```
Runs at `http://localhost:5001`. Keep this running.

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

---

## Testing the API Directly

```bash
curl -X POST http://localhost:5001/api/match \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "paste resume text here"}'
```

Expected response:
```json
{
  "status": "success",
  "category": "ENGINEERING",
  "matches": [
    { "soc_code": "17-2141.00", "job_title": "Mechanical Engineers", "score": 0.0631 },
    { "soc_code": "17-2071.00", "job_title": "Electrical Engineers", "score": 0.0612 },
    ...
  ]
}
```

- `category` — the broad job category the classifier predicted from your resume
- `matches` — top 5 specific O*NET job titles ranked by similarity score

---

## Notes

- The backend loads trained models at startup — if `models/` is empty it will crash. Run the ML pipeline first.
- Raw data files and trained models are git-ignored. Don't commit them.
- Frontend and backend run on different ports. Both need to be up at the same time for the full app to work.
