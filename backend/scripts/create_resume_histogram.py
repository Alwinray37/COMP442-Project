from pathlib import Path
import os
import sys

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import DIAGRAM_DIR, RESUME_CSV

cache_dir = Path(__file__).resolve().parents[2] / ".cache"
cache_dir.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(cache_dir / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(cache_dir))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def main():
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
