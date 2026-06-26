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
import matplotlib.ticker as mtick
import pandas as pd


def main():
    """Create a missingness chart for the raw job postings dataset."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    if not JOB_POSTINGS_CSV.exists():
        print(f"Warning: job postings file not found at {JOB_POSTINGS_CSV}")
        return

    jobs = pd.read_csv(JOB_POSTINGS_CSV)
    missing_pct = (jobs.isnull().sum() / len(jobs) * 100).sort_values(ascending=True)
    missing_pct = missing_pct[missing_pct > 0]

    if missing_pct.empty:
        print("No missing values found in job postings dataset.")
        return

    fig, ax = plt.subplots(figsize=(9, 6))
    colors = ['#d9534f' if v >= 50 else '#f0ad4e' if v >= 20 else '#5bc0de' for v in missing_pct]
    bars = ax.barh(missing_pct.index, missing_pct.values, color=colors, edgecolor='white')

    ax.xaxis.set_major_formatter(mtick.PercentFormatter())
    ax.set_xlabel('Missing Values (%)', fontsize=11)
    ax.set_title('Missing Data by Column — Job Postings Dataset', fontsize=13, fontweight='bold')
    ax.axvline(x=50, color='#d9534f', linestyle='--', linewidth=0.8, alpha=0.6, label='50% threshold')
    ax.legend(fontsize=9)

    for bar, value in zip(bars, missing_pct.values):
        ax.text(value + 0.5, bar.get_y() + bar.get_height() / 2, f'{value:.1f}%', va='center', fontsize=8)

    output_path = FIGURE_DIR / 'job_missingness_chart.png'
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'Saved to {output_path}')


if __name__ == "__main__":
    main()
