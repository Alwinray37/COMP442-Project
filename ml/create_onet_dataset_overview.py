import os
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import CACHE_DIR, FIGURE_DIR, RAW_DATA_DIR

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


ONET_FILES = [
    ("Occupation Data", "Occupation Data.xlsx", "Metadata: title, SOC code, description"),
    ("Essential Skills", "Essential Skills.xlsx", "Core skills"),
    ("Knowledge", "Knowledge.xlsx", "Knowledge domains"),
    ("Abilities", "Abilities.xlsx", "Required abilities"),
    ("Work Activities", "Work Activities.xlsx", "Day-to-day tasks"),
    ("Work Styles", "Work Styles.xlsx", "Work traits"),
    ("Software Skills", "Software Skills.xlsx", "Software tools/examples"),
]


def load_summary():
    rows = []
    for label, filename, role in ONET_FILES:
        path = RAW_DATA_DIR / filename
        df = pd.read_excel(path)
        unique_soc = df["O*NET-SOC Code"].nunique() if "O*NET-SOC Code" in df.columns else 0
        rows.append(
            {
                "dataset": label,
                "file": filename,
                "role": role,
                "rows": len(df),
                "unique_soc_codes": unique_soc,
                "columns": len(df.columns),
            }
        )
    return pd.DataFrame(rows)


def plot_overview(summary):
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    summary = summary.sort_values("rows", ascending=True)
    colors = ["#5b4bb7", "#0b5d4b", "#c7661f", "#5b4bb7", "#0b5d4b", "#c7661f", "#5b4bb7"]

    fig, (ax_rows, ax_soc) = plt.subplots(
        1,
        2,
        figsize=(14, 7),
        gridspec_kw={"width_ratios": [1.35, 1]},
    )

    ax_rows.barh(summary["dataset"], summary["rows"], color=colors)
    ax_rows.set_title("Raw O*NET File Size")
    ax_rows.set_xlabel("Rows")
    ax_rows.grid(axis="x", alpha=0.25)
    for i, value in enumerate(summary["rows"]):
        ax_rows.text(value, i, f" {value:,}", va="center", fontsize=9)

    ax_soc.barh(summary["dataset"], summary["unique_soc_codes"], color="#0b5d4b")
    ax_soc.set_title("Occupation Coverage")
    ax_soc.set_xlabel("Unique O*NET-SOC codes")
    ax_soc.grid(axis="x", alpha=0.25)
    for i, value in enumerate(summary["unique_soc_codes"]):
        ax_soc.text(value, i, f" {value:,}", va="center", fontsize=9)

    fig.suptitle("O*NET Raw Datasets Used to Build Occupation Profiles", fontsize=16, fontweight="bold")
    fig.text(
        0.5,
        0.02,
        "All files share O*NET-SOC Code; preprocessing combines title, description, attributes, and software examples into onet_profiles.csv.",
        ha="center",
        fontsize=10,
        color="#4b5563",
    )
    plt.tight_layout(rect=[0, 0.05, 1, 0.94])

    output_path = FIGURE_DIR / "onet_dataset_overview.png"
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def main():
    summary = load_summary()
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    summary_path = FIGURE_DIR / "onet_dataset_overview.csv"
    summary.to_csv(summary_path, index=False)
    figure_path = plot_overview(summary)
    print(f"Saved {summary_path}")
    print(f"Saved {figure_path}")


if __name__ == "__main__":
    main()
