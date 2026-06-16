import pandas as pd
import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import chi2_contingency
from itertools import combinations

#load dataset
df = pd.read_csv(r"job_postings.csv")

#select numeric columns
numeric_df = df.select_dtypes(include=np.number)

#correlation matrix
corr_matrix = numeric_df.corr(method='pearson')
categorical_cols = df.select_dtypes(include=['str', 'category']).columns.tolist()
numeric_cols = numeric_df.columns.tolist()

# Pearson Correlation

def correlation_strength(val):
    val = abs(val)
    if val >= 0.7:
        return "Strong"
    elif val >= 0.4:
        return "Moderate"
    else:
        return "Weak"

#build summary table rows
pearson_rows = []
for col1, col2 in combinations(numeric_cols, 2):
    val = corr_matrix.loc[col1, col2]
    pearson_rows.append({
        "Feature Pair": f"{col1} & {col2}",
        "Correlation Value": round(val, 4),
        "Strength": correlation_strength(val),
        "Interpretation": "Positive" if val > 0 else "Negative"
    })

pearson_df = pd.DataFrame(pearson_rows)
pd.set_option('display.max_rows',None)
print(pearson_df)
print("\nStrength Counts:")
print(pearson_df["Strength"].value_counts().to_string())

#heatmap
plt.figure(figsize=(10,8))
sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="coolwarm", square=True)
plt.title("Pearson Correlation Heatmap")
plt.tight_layout()
plt.savefig("correlation_heatmap.png")
plt.close()
print("Heatmap saved to correlation_heatmap.png")

#Chi Square
# filter to low-cardinality categorical cols only
categorical_cols = [col for col in categorical_cols if df[col].nunique() <= 20]

# sample for chi-square, times out if dataset is too large
df_sample = df.sample(n=min(5000, len(df)), random_state=42)

chi_rows = []
for col1, col2 in combinations(categorical_cols, 2):
    contingency_table = pd.crosstab(df_sample[col1], df_sample[col2])
    chi2, p, dof, expected = chi2_contingency(contingency_table)
    chi_rows.append({
        "Categorical Feature Pair": f"{col1} & {col2}",
        "Chi-Square Result": round(chi2, 4),
        "p-value": round(p, 4),
        "Interpretation": "Significant (p < 0.05)" if p < 0.05 else "Not Significant"
    })

chi_df = pd.DataFrame(chi_rows)
print(chi_df)