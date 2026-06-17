# COMP442 Project

AI-powered resume tailoring and job matching system for COMP442.

The project combines resume data, LinkedIn job posting data, and O*NET skill reference data to support NLP-based resume parsing, job matching, skill-gap analysis, and exploratory data visualization.

## Project Structure

```text
COMP442-Project/
  backend/
    app.py
    config.py
    services/
      job_parser.py
      recommender.py
      resume_parser.py
      skill_rules.py
    scripts/
      create_visualizations.py
      create_correlation_analysis.py
      create_resume_histogram.py
  data/
    raw/
      Resume.csv
      job_postings.csv
      Occupation Data.xlsx
      Software Skills.xlsx
      Transferable Skills.xlsx
  frontend/
    src/
      pages/
      components/
  outputs/
    diagrams/
    figures/
  requirements.txt
```

## Data

Place raw datasets in `data/raw/`.

Expected files:

- `data/raw/Resume.csv`
- `data/raw/job_postings.csv`
- `data/raw/Occupation Data.xlsx`
- `data/raw/Software Skills.xlsx`
- `data/raw/Transferable Skills.xlsx`

The visualization scripts can still run without the O*NET Excel files. Backend skill-gap analysis depends on the O*NET files.

## Backend Purpose

The backend provides the API and data processing logic.

Main features:

- Parse resume text and PDF resumes.
- Load and clean job posting descriptions.
- Match resumes to job postings using TF-IDF and cosine similarity.
- Analyze skill gaps using O*NET skill reference files.

Backend endpoints:

- `GET /status`
- `POST /api/match`
- `POST /api/analyze_gap`

## Frontend Purpose

The frontend is a React/Vite app for the resume matching interface.

Current pages:

- `/` project landing page
- `/intake` resume intake UI

The intake page currently supports PDF upload and manual profile entry UI. Full API connection is still in progress.

## Requirements

Python requirements are in:

```text
requirements.txt
```

Current packages:

```text
pandas
matplotlib
seaborn
scipy
```

The backend also uses:

```text
Flask
PyPDF2
scikit-learn
openpyxl
requests
```

These are listed in `backend/requirements.txt`.

## Setup

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install root analysis requirements:

```bash
pip install -r requirements.txt
```

Install backend requirements:

```bash
pip install -r backend/requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run Backend

From the project root:

```bash
cd backend
../.venv/bin/python app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

Check status:

```bash
curl http://127.0.0.1:5000/status
```

## Run Frontend

From the project root:

```bash
cd frontend
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

## Generate Visualizations

Run exploratory resume and job-posting visualizations:

```bash
.venv/bin/python backend/scripts/create_visualizations.py
```

Outputs:

```text
outputs/figures/resume_category_distribution.png
outputs/figures/resume_token_count_histogram.png
outputs/figures/resume_numeric_feature_boxplot.png
outputs/figures/numeric_feature_correlation_heatmap.png
```

Run job posting correlation analysis:

```bash
.venv/bin/python backend/scripts/create_correlation_analysis.py
```

Outputs:

```text
outputs/figures/job_numeric_correlation_heatmap.png
outputs/figures/job_pearson_correlation_summary.csv
outputs/figures/job_chi_square_summary.csv
```

Run the simple resume histogram script:

```bash
.venv/bin/python backend/scripts/create_resume_histogram.py
```

Output:

```text
outputs/diagrams/resume_word_count_histogram.png
```

## Current Notes

- Raw data files are ignored by git.
- Generated figures are stored in `outputs/`.
- `backend/config.py` centralizes project paths.
- The frontend and backend are not fully connected yet.
