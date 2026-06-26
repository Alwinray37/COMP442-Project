from itertools import combinations
from pathlib import Path
import os
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import CACHE_DIR, FIGURE_DIR, JOB_POSTINGS_CSV

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.stats import chi2_contingency


def correlation_strength(value):
    """Label the strength of a Pearson correlation value."""
    value = abs(value)
    if value >= 0.7:
        return "Strong"
    if value >= 0.4:
        return "Moderate"
    return "Weak"


def load_job_data():
    """Load LinkedIn job postings data."""
    if not JOB_POSTINGS_CSV.exists():
        print(f"Warning: job postings file not found at {JOB_POSTINGS_CSV}")
        return None

    job_df = pd.read_csv(JOB_POSTINGS_CSV)
    print(f"Loaded job posting data from {JOB_POSTINGS_CSV}")
    return job_df


def create_numeric_features(job_df):
    """Create useful numeric text features for correlation analysis."""
    if job_df is None:
        return None

    if "description" in job_df.columns:
        job_df["job_description_token_count"] = (
            job_df["description"].fillna("").astype(str).str.split().str.len()
        )
    else:
        print("Warning: description column is missing; skipping job_description_token_count")

    if "skills_desc" in job_df.columns:
        job_df["skills_description_token_count"] = (
            job_df["skills_desc"].fillna("").astype(str).str.split().str.len()
        )
    else:
        print("Warning: skills_desc column is missing; skipping skills_description_token_count")

    return job_df


def build_pearson_summary(numeric_df, corr_matrix):
    """Build a readable Pearson correlation summary table."""
    rows = []

    for col1, col2 in combinations(numeric_df.columns, 2):
        value = corr_matrix.loc[col1, col2]
        if pd.isna(value):
            continue

        rows.append(
            {
                "feature_pair": f"{col1} & {col2}",
                "correlation_value": round(value, 4),
                "strength": correlation_strength(value),
                "interpretation": "Positive" if value > 0 else "Negative",
            }
        )

    return pd.DataFrame(rows)


def plot_pearson_heatmap(job_df):
    """Create Pearson correlation table and heatmap for numeric job features."""
    if job_df is None:
        return

    numeric_df = job_df.select_dtypes(include=np.number).dropna(axis=1, how="all")
    numeric_df = numeric_df.loc[:, numeric_df.nunique(dropna=True) > 1]

    if len(numeric_df.columns) < 2:
        print("Warning: fewer than two valid numeric columns; skipping Pearson correlation")
        return

    corr_matrix = numeric_df.corr(method="pearson")
    pearson_df = build_pearson_summary(numeric_df, corr_matrix)

    pearson_output = FIGURE_DIR / "job_pearson_correlation_summary.csv"
    pearson_df.to_csv(pearson_output, index=False)

    plt.figure(figsize=(12, 10))
    sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="coolwarm", square=True)
    plt.title("Job Posting Numeric Feature Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(FIGURE_DIR / "job_numeric_correlation_heatmap.png", dpi=150)
    plt.close()

    print(f"Saved Pearson summary to {pearson_output}")
    print(f"Saved heatmap to {FIGURE_DIR / 'job_numeric_correlation_heatmap.png'}")


def run_chi_square_analysis(job_df):
    """Run chi-square tests between low-cardinality categorical job columns."""
    if job_df is None:
        return

    categorical_cols = job_df.select_dtypes(include=["object", "string", "category"]).columns.tolist()
    categorical_cols = [
        col for col in categorical_cols if 1 < job_df[col].nunique(dropna=True) <= 20
    ]

    if len(categorical_cols) < 2:
        print("Warning: fewer than two low-cardinality categorical columns; skipping chi-square")
        return

    job_sample = job_df.sample(n=min(5000, len(job_df)), random_state=42)
    rows = []

    for col1, col2 in combinations(categorical_cols, 2):
        contingency_table = pd.crosstab(job_sample[col1], job_sample[col2])

        if contingency_table.empty:
            continue

        chi2, p_value, degrees_of_freedom, _ = chi2_contingency(contingency_table)
        rows.append(
            {
                "categorical_feature_pair": f"{col1} & {col2}",
                "chi_square_result": round(chi2, 4),
                "p_value": round(p_value, 4),
                "degrees_of_freedom": degrees_of_freedom,
                "interpretation": "Significant (p < 0.05)"
                if p_value < 0.05
                else "Not Significant",
            }
        )

    chi_df = pd.DataFrame(rows)
    chi_output = FIGURE_DIR / "job_chi_square_summary.csv"
    chi_df.to_csv(chi_output, index=False)
    print(f"Saved chi-square summary to {chi_output}")


def main():
    """Generate correlation analysis outputs for job posting data."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    job_df = load_job_data()
    job_df = create_numeric_features(job_df)

    plot_pearson_heatmap(job_df)
    run_chi_square_analysis(job_df)


if __name__ == "__main__":
    main()
