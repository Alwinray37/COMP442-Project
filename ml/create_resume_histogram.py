from pathlib import Path
import os
import sys

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import CACHE_DIR, DIAGRAM_DIR, RESUME_CSV

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)

    resumes = pd.read_csv(RESUME_CSV)
    resumes["resume_word_count"] = (
        resumes["Resume_str"]
        .fillna("")
        .astype(str)
        .str.split()
        .str.len()
    )

    plt.figure(figsize=(10, 6))
    plt.hist(resumes["resume_word_count"], bins=30, color="#0f766e", edgecolor="white")
    plt.title("Resume Word Count Distribution")
    plt.xlabel("Word Count")
    plt.ylabel("Number of Resumes")
    plt.tight_layout()

    output_path = DIAGRAM_DIR / "resume_word_count_histogram.png"
    plt.savefig(output_path, dpi=150)
    plt.close()

    print(f"Saved histogram to {output_path}")


if __name__ == "__main__":
    main()
