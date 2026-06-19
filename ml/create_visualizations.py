from pathlib import Path
import os
import re
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import CACHE_DIR, FIGURE_DIR, JOB_POSTINGS_CSV, RESUME_CSV, RESUMES_CSV

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd


RESUME_PATHS = [
    RESUMES_CSV,
    RESUME_CSV,
]

SKILL_KEYWORDS = [
    "Python",
    "Java",
    "JavaScript",
    "SQL",
    "React",
    "HTML",
    "CSS",
    "Excel",
    "Git",
    "AWS",
    "communication",
    "leadership",
    "management",
    "customer service",
    "project management",
]

SOFTWARE_SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Git",
    "Excel",
    "SQL",
    "AWS",
    "Tableau",
    "Power BI",
]

TRANSFERABLE_SKILLS = [
    "communication",
    "leadership",
    "teamwork",
    "problem solving",
    "management",
    "organization",
    "training",
    "collaboration",
]


def load_data():
    """Load resume and job posting datasets if available."""
    resume_df = None
    job_df = None

    for path in RESUME_PATHS:
        if path.exists():
            resume_df = pd.read_csv(path)
            print(f"Loaded resume data from {path}")
            break

    if resume_df is None:
        print("Warning: resume dataset not found in data/raw/resumes.csv or data/raw/Resume.csv")

    if JOB_POSTINGS_CSV.exists():
        job_df = pd.read_csv(JOB_POSTINGS_CSV)
        print(f"Loaded job posting data from {JOB_POSTINGS_CSV}")
    else:
        print("Warning: job postings dataset not found at data/raw/job_postings.csv")

    return resume_df, job_df


def create_resume_token_count(resume_df):
    """Create resume_token_count from Resume_str."""
    if resume_df is None:
        return None

    if "Resume_str" not in resume_df.columns:
        print("Warning: Resume_str column is missing; cannot create resume_token_count")
        return resume_df

    resume_df["resume_token_count"] = (
        resume_df["Resume_str"].fillna("").astype(str).str.split().str.len()
    )
    return resume_df


def count_keyword_matches(text, keywords):
    """Count keyword matches in one text field."""
    text = str(text).lower()
    count = 0

    for keyword in keywords:
        pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
        count += len(re.findall(pattern, text))

    return count


def create_skill_counts(resume_df):
    """Create simple keyword-based skill count features."""
    if resume_df is None:
        return None

    if "Resume_str" not in resume_df.columns:
        print("Warning: Resume_str column is missing; cannot create skill count features")
        return resume_df

    if "skill_keyword_count" not in resume_df.columns:
        resume_df["skill_keyword_count"] = resume_df["Resume_str"].apply(
            lambda text: count_keyword_matches(text, SKILL_KEYWORDS)
        )

    if "software_skill_count" not in resume_df.columns:
        resume_df["software_skill_count"] = resume_df["Resume_str"].apply(
            lambda text: count_keyword_matches(text, SOFTWARE_SKILLS)
        )

    if "transferable_skill_count" not in resume_df.columns:
        resume_df["transferable_skill_count"] = resume_df["Resume_str"].apply(
            lambda text: count_keyword_matches(text, TRANSFERABLE_SKILLS)
        )

    return resume_df


def plot_resume_category_distribution(resume_df):
    """Plot resume count by category."""
    if resume_df is None or "Category" not in resume_df.columns:
        print("Warning: Category column is missing; skipping resume category chart")
        return

    category_counts = resume_df["Category"].dropna().value_counts().sort_values()
    if category_counts.empty:
        print("Warning: Category column has no valid values; skipping resume category chart")
        return

    plt.figure(figsize=(10, 8))
    category_counts.plot(kind="barh", color="#0f766e")
    plt.title("Resume Category Distribution")
    plt.xlabel("Number of Resumes")
    plt.ylabel("Category")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "resume_category_distribution.png", dpi=150)
    plt.close()


def plot_resume_token_histogram(resume_df):
    """Plot histogram of resume token counts."""
    if resume_df is None or "resume_token_count" not in resume_df.columns:
        print("Warning: resume_token_count is missing; skipping token histogram")
        return

    token_counts = resume_df["resume_token_count"].dropna()
    if token_counts.empty:
        print("Warning: resume_token_count has no valid values; skipping token histogram")
        return

    plt.figure(figsize=(10, 6))
    plt.hist(token_counts, bins=30, color="#2563eb", edgecolor="white")
    plt.title("Resume Token Count Histogram")
    plt.xlabel("Resume Token Count")
    plt.ylabel("Number of Resumes")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "resume_token_count_histogram.png", dpi=150)
    plt.close()


def plot_job_description_token_histogram(job_df):
    """Plot histogram of job description token counts."""
    if job_df is None or "description" not in job_df.columns:
        print("Warning: description column is missing; skipping job description token histogram")
        return

    job_description_token_count = (
        job_df["description"].fillna("").astype(str).str.split().str.len()
    )
    job_description_token_count = job_description_token_count[job_description_token_count > 0]

    if job_description_token_count.empty:
        print("Warning: description column has no valid values; skipping job description token histogram")
        return

    plt.figure(figsize=(10, 6))
    plt.hist(job_description_token_count, bins=30, color="#7c3aed", edgecolor="white")
    plt.title("Job Description Token Count Histogram")
    plt.xlabel("Job Description Token Count")
    plt.ylabel("Number of Job Postings")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "job_description_token_count_histogram.png", dpi=150)
    plt.close()


def plot_numeric_feature_boxplot(resume_df):
    """Plot a box plot for numeric resume features."""
    if resume_df is None:
        print("Warning: resume data is missing; skipping numeric feature boxplot")
        return

    numeric_columns = [
        "resume_token_count",
        "skill_keyword_count",
        "software_skill_count",
        "transferable_skill_count",
    ]
    available_columns = [column for column in numeric_columns if column in resume_df.columns]

    if not available_columns:
        print("Warning: no numeric resume features available; skipping boxplot")
        return

    numeric_df = resume_df[available_columns].apply(pd.to_numeric, errors="coerce").dropna(how="all")
    if numeric_df.empty:
        print("Warning: numeric resume features have no valid values; skipping boxplot")
        return

    plt.figure(figsize=(10, 6))
    plt.boxplot(
        [numeric_df[column].dropna() for column in available_columns],
        tick_labels=available_columns,
        patch_artist=True,
    )
    plt.title("Box Plot of Numeric Resume Features")
    plt.ylabel("Feature Count")
    plt.xticks(rotation=20, ha="right")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "resume_numeric_feature_boxplot.png", dpi=150)
    plt.close()


def plot_correlation_heatmap(resume_df, job_df):
    """Plot a correlation heatmap for resume and job numeric features."""
    numeric_data = pd.DataFrame()

    if resume_df is not None:
        resume_columns = [
            "resume_token_count",
            "skill_keyword_count",
            "software_skill_count",
            "transferable_skill_count",
        ]
        for column in resume_columns:
            if column in resume_df.columns:
                numeric_data[column] = pd.to_numeric(resume_df[column], errors="coerce").reset_index(drop=True)

    if job_df is not None:
        if "description" in job_df.columns:
            numeric_data["job_description_token_count"] = (
                job_df["description"].fillna("").astype(str).str.split().str.len().reset_index(drop=True)
            )
        else:
            print("Warning: description column is missing; skipping job_description_token_count")

    numeric_data = numeric_data.dropna(axis=1, how="all")
    numeric_data = numeric_data.loc[:, numeric_data.nunique(dropna=True) > 1]

    if len(numeric_data.columns) < 2:
        print("Warning: fewer than two valid numeric features; skipping correlation heatmap")
        return

    correlation = numeric_data.corr()

    plt.figure(figsize=(9, 7))
    image = plt.imshow(correlation, cmap="viridis", vmin=-1, vmax=1)
    plt.colorbar(image, label="Correlation")
    plt.xticks(range(len(correlation.columns)), correlation.columns, rotation=35, ha="right")
    plt.yticks(range(len(correlation.columns)), correlation.columns)

    for row_index, row_name in enumerate(correlation.index):
        for col_index, col_name in enumerate(correlation.columns):
            plt.text(
                col_index,
                row_index,
                f"{correlation.loc[row_name, col_name]:.2f}",
                ha="center",
                va="center",
                color="white",
                fontsize=9,
            )

    plt.title("Numeric Feature Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "numeric_feature_correlation_heatmap.png", dpi=150)
    plt.close()


def main():
    """Generate all Assignment 3 exploratory data visualizations."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    resume_df, job_df = load_data()
    resume_df = create_resume_token_count(resume_df)
    resume_df = create_skill_counts(resume_df)

    plot_resume_category_distribution(resume_df)
    plot_resume_token_histogram(resume_df)
    plot_job_description_token_histogram(job_df)
    plot_numeric_feature_boxplot(resume_df)
    plot_correlation_heatmap(resume_df, job_df)

    print(f"Finished creating figures in {FIGURE_DIR}")


if __name__ == "__main__":
    main()
