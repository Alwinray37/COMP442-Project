import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '../../outputs/figures/job_missingness_chart.png')

jobs = pd.read_csv(os.path.join(os.path.dirname(__file__), '../../data/raw/job_postings.csv'))

missing_pct = (jobs.isnull().sum() / len(jobs) * 100).sort_values(ascending=True)
missing_pct = missing_pct[missing_pct > 0]

fig, ax = plt.subplots(figsize=(9, 6))

colors = ['#d9534f' if v >= 50 else '#f0ad4e' if v >= 20 else '#5bc0de' for v in missing_pct]
bars = ax.barh(missing_pct.index, missing_pct.values, color=colors, edgecolor='white')

ax.xaxis.set_major_formatter(mtick.PercentFormatter())
ax.set_xlabel('Missing Values (%)', fontsize=11)
ax.set_title('Missing Data by Column — Job Postings Dataset', fontsize=13, fontweight='bold')
ax.axvline(x=50, color='#d9534f', linestyle='--', linewidth=0.8, alpha=0.6, label='50% threshold')
ax.legend(fontsize=9)

for bar, val in zip(bars, missing_pct.values):
    ax.text(val + 0.5, bar.get_y() + bar.get_height() / 2,
            f'{val:.1f}%', va='center', fontsize=8)

plt.tight_layout()
plt.savefig(OUTPUT_PATH, dpi=150, bbox_inches='tight')
print(f'Saved to {OUTPUT_PATH}')
