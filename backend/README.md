# Backend — Data Preprocessing & ML Pipeline

This document describes the full data preprocessing and preparation pipeline for the COMP442 Job Recommender system.

---

## Overview

Our preprocessing pipeline prepares two sources of data for model training and occupation matching:

1. **Resume.csv** — 2,484 labeled resumes across 24 job categories (training data for the classifier)
2. **O\*NET Database** — 1,000+ occupations with structured skill, knowledge, ability, work activity, and work style profiles (used for occupation matching)

The pipeline is located in `ml/preprocess.py` and must be run before training.

---

## Step 1 — Data Cleaning (Resume Dataset)

**File:** `ml/preprocess.py` → `preprocess_resumes()`

### What we do and why

| Step | Action | Reason |
|---|---|---|
| Load | Read `data/raw/Resume.csv` | 2,484 resumes across 24 categories |
| Drop duplicates | Remove rows where `Resume_str` is identical | 2 exact duplicates found — they would bias the model |
| Drop column | Remove `Resume_html` | Identical content to `Resume_str` in HTML format — no additional signal |
| Clean text | Lowercase, remove punctuation via `\W+` regex, strip whitespace | Normalizes vocabulary — "Python." and "python" become the same token |
| Save | Write to `data/processed/resumes_clean.csv` | Processed data stays separate from raw |

### Result
- Input: 2,484 rows, 4 columns
- Output: 2,482 rows, 2 columns (`Resume_str`, `Category`)

---

## Step 2 — Data Cleaning (O\*NET Files)

**File:** `ml/preprocess.py` → `preprocess_onet()`

The following O\*NET files are used:

| File | Contents |
|---|---|
| `Occupation Data.xlsx` | 1,016 occupation titles and SOC codes |
| `Essential Skills.xlsx` | Core skills mapped to each occupation |
| `Knowledge.xlsx` | Knowledge domains per occupation |
| `Abilities.xlsx` | Required abilities per occupation |
| `Work Activities.xlsx` | Day-to-day tasks per occupation |
| `Work Styles.xlsx` | Personality and work style traits per occupation |

### What we do and why

| Step | Action | Reason |
|---|---|---|
| Filter by importance | Keep only rows where `Scale ID = IM` (Importance) and `Data Value >= 3.0` | Removes low-relevance skills from each occupation profile — reduces noise |
| Drop irrelevant columns | Remove `Standard Error`, `CI Bound`, `Date`, `Domain Source`, `N` | No predictive value — statistical metadata only |
| Join on SOC code | Merge all five skill files on `O*NET-SOC Code` | Combines all attributes into one record per occupation |
| Build text profile | Concatenate all `Element Name` values per occupation into one string | Creates a single document per occupation — same format as a resume |
| Clean text | Lowercase, remove punctuation, normalize whitespace | Matches the same cleaning applied to resumes — enables fair comparison |
| Save | Write to `data/processed/onet_profiles.csv` | One row per occupation: `soc_code`, `title`, `profile_text` |

### Result
- Input: ~150,000 rows across 5 files
- Output: ~1,016 rows — one unified text profile per occupation

---

## Step 3 — Data Transformation

### TF-IDF Vectorization
Applied in `ml/train_classifier.py`.

Raw cleaned text is converted to numerical vectors using TF-IDF (Term Frequency–Inverse Document Frequency). The vectorizer is fit on the resume training text plus O\*NET profile text so both sources share one vocabulary:
- **TF** — how often a word appears in one resume
- **IDF** — down-weights words that appear across all resumes (common words carry less meaning)
- **Result** — each resume becomes a 5,000-dimensional sparse vector

Parameters:
- `max_features=5000` — top 5,000 most informative terms only (controls dimensionality)
- `stop_words='english'` — removes common uninformative words (the, and, is...)

### Label Encoding
The target variable `Category` (e.g. `ENGINEERING`, `HEALTHCARE`) is passed directly to scikit-learn's `LogisticRegression`, which handles string labels internally.

---

## Step 4 — Feature Selection

### What we kept and why

**From Resume.csv:**
| Column | Keep | Reason |
|---|---|---|
| `Resume_str` | ✅ | Contains all signal — skills, experience, education |
| `Category` | ✅ | Classification target |
| `Resume_html` | ❌ | Redundant with `Resume_str` |
| `ID` | ❌ | Meaningless identifier |

**From O\*NET:**
| Column | Keep | Reason |
|---|---|---|
| `O*NET-SOC Code` | ✅ | Join key across all files |
| `Title` | ✅ | Human-readable output label |
| `Element Name` | ✅ | Core feature — the skill/knowledge/ability name |
| `Data Value` | ✅ (filtered) | Used to filter low-importance entries only |
| `Standard Error`, CI bounds, `Date` | ❌ | Statistical metadata — no predictive value |

### Dimensionality
Without `max_features`, TF-IDF on 2,482 resumes would produce ~30,000+ dimensions. Capping at 5,000 prevents the curse of dimensionality, reduces overfitting, and speeds up training.

---

## Step 5 — Data Integration

The resume dataset and O\*NET files come from different sources with different schemas. They are unified as follows:

1. All five O\*NET skill files share the `O*NET-SOC Code` key — they are merged on this key to produce one profile per occupation
2. Both resumes and occupation profiles are converted to the same text vector format using TF-IDF — this resolves the schema mismatch and enables direct comparison via cosine similarity
3. The 24 resume categories bridge to O\*NET via the classifier: the model predicts a broad category, and O\*NET matching runs within that category

---

## Running the Pipeline

```bash
# From project root
source .venv/bin/activate

# Step 1 — clean and prepare data
python ml/preprocess.py

# Step 2 — train the classifier
python ml/train_classifier.py

# Step 3 — evaluate
python ml/evaluate.py

# Step 4 — start the API
cd backend && python app.py
```

---

## Current Status

| Item | Code Status |
|---|---|
| Resume cleaning | Done |
| O\*NET profile building | Done |
| Feature selection with `Data Value` filter | Done |
| TF-IDF vectorization | Done in `ml/train_classifier.py` |
| Two-stage pipeline: classify, then match to O\*NET | Done |
| Flask prediction API | Done |
