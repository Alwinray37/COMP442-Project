import pandas as pd
import re
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import (
    ONET_OCCUPATION_XLSX,
    ONET_PROFILE_FILES,
    ONET_PROFILES_CSV,
    PROCESSED_DATA_DIR,
    RESUME_CSV,
    RESUMES_CLEAN_CSV,
)

PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\W+', ' ', text)
    return text.strip()


def preprocess_resumes():
    df = pd.read_csv(RESUME_CSV)
    df = df.drop_duplicates(subset='Resume_str')
    df = df.drop(columns=['Resume_html'])
    df['Resume_str'] = df['Resume_str'].apply(clean_text)
    df.to_csv(RESUMES_CLEAN_CSV, index=False)
    print(f"Resumes: {len(df)} rows saved to data/processed/resumes_clean.csv")


def preprocess_onet():
    frames = []
    for path in ONET_PROFILE_FILES:
        df = pd.read_excel(path)
        # Work Styles has no Scale ID — include all rows
        if 'Scale ID' in df.columns:
            df = df[df['Scale ID'] == 'IM']
            df = df[df['Data Value'] >= 3.0]
        frames.append(df[['O*NET-SOC Code', 'Element Name']])

    combined = pd.concat(frames, ignore_index=True)

    # Build one text profile per occupation by joining all element names
    profiles = (
        combined
        .groupby('O*NET-SOC Code')['Element Name']
        .apply(lambda names: ' '.join(names.dropna().unique()))
        .reset_index()
        .rename(columns={'Element Name': 'profile_text'})
    )

    # Join occupation titles and descriptions from Occupation Data
    occ = pd.read_excel(ONET_OCCUPATION_XLSX)[['O*NET-SOC Code', 'Title', 'Description']]
    profiles = profiles.merge(occ, on='O*NET-SOC Code', how='left')

    profiles['profile_text'] = profiles['profile_text'].apply(clean_text)
    profiles = profiles[['O*NET-SOC Code', 'Title', 'Description', 'profile_text']]
    profiles.to_csv(ONET_PROFILES_CSV, index=False)
    print(f"O*NET: {len(profiles)} occupation profiles saved to data/processed/onet_profiles.csv")


if __name__ == '__main__':
    preprocess_resumes()
    preprocess_onet()
