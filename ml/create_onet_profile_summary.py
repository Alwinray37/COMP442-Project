import os
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import CACHE_DIR, FIGURE_DIR, ONET_PROFILES_CSV

os.environ.setdefault("MPLCONFIGDIR", str(CACHE_DIR / "matplotlib"))
os.environ.setdefault("XDG_CACHE_HOME", str(CACHE_DIR))

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


SOC_MAJOR_GROUPS = {
    "11": "Management",
    "13": "Business/Finance",
    "15": "Computer/Math",
    "17": "Engineering",
    "19": "Science",
    "21": "Community/Social",
    "23": "Legal",
    "25": "Education",
    "27": "Arts/Media/Sports",
    "29": "Healthcare Practitioners",
    "31": "Healthcare Support",
    "33": "Protective Service",
    "35": "Food Service",
    "37": "Cleaning/Maintenance",
    "39": "Personal Care",
    "41": "Sales",
    "43": "Office/Admin",
    "45": "Agriculture",
    "47": "Construction",
    "49": "Installation/Repair",
    "51": "Production",
    "53": "Transportation",
}


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    profiles = pd.read_csv(ONET_PROFILES_CSV)
    profiles["profile_token_count"] = (
        profiles["profile_text"].fillna("").astype(str).str.split().str.len()
    )
    profiles["soc_major_group"] = profiles["O*NET-SOC Code"].str[:2]
    profiles["soc_major_label"] = profiles["soc_major_group"].map(SOC_MAJOR_GROUPS).fillna("Other")

    major_counts = profiles["soc_major_label"].value_counts().sort_values()

    fig, (ax_tokens, ax_groups) = plt.subplots(
        1,
        2,
        figsize=(15, 7),
        gridspec_kw={"width_ratios": [1, 1.2]},
    )

    ax_tokens.hist(
        profiles["profile_token_count"],
        bins=30,
        color="#5b4bb7",
        edgecolor="white",
    )
    ax_tokens.set_title("Generated O*NET Profile Lengths")
    ax_tokens.set_xlabel("Tokens in profile_text")
    ax_tokens.set_ylabel("Number of occupations")
    ax_tokens.grid(axis="y", alpha=0.25)

    ax_groups.barh(major_counts.index, major_counts.values, color="#0b5d4b")
    ax_groups.set_title("Processed Occupations by SOC Major Group")
    ax_groups.set_xlabel("Number of occupations")
    ax_groups.grid(axis="x", alpha=0.25)
    for i, value in enumerate(major_counts.values):
        ax_groups.text(value, i, f" {value}", va="center", fontsize=9)

    fig.suptitle("Processed O*NET Occupation Profiles", fontsize=16, fontweight="bold")
    fig.text(
        0.5,
        0.02,
        "Each row in onet_profiles.csv is one occupation with title, description, attributes, software examples, and profile_text for matching.",
        ha="center",
        fontsize=10,
        color="#4b5563",
    )
    plt.tight_layout(rect=[0, 0.05, 1, 0.94])

    figure_path = FIGURE_DIR / "onet_profile_summary.png"
    summary_path = FIGURE_DIR / "onet_profile_summary.csv"
    profiles[
        ["O*NET-SOC Code", "Title", "soc_major_label", "profile_token_count"]
    ].to_csv(summary_path, index=False)
    plt.savefig(figure_path, dpi=150)
    plt.close()

    print(f"Saved {summary_path}")
    print(f"Saved {figure_path}")


if __name__ == "__main__":
    main()
