import pandas as pd
import re
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from project_paths import (
    ONET_OCCUPATION_XLSX,
    ONET_PROFILE_FILES,
    ONET_PROFILES_CSV,
    ONET_SOFTWARE_SKILLS_XLSX,
    PROCESSED_DATA_DIR,
    RESUME_CSV,
    RESUMES_CLEAN_CSV,
)

PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\W+', ' ', text)
    return text.strip()


def join_unique(values):
    return ' '.join(str(value) for value in values.dropna().unique())


def preprocess_resumes():
    df = pd.read_csv(RESUME_CSV)
    df = df.drop_duplicates(subset='Resume_str')
    df = df.drop(columns=['Resume_html'])
    df['Resume_str'] = df['Resume_str'].apply(clean_text)
    df.to_csv(RESUMES_CLEAN_CSV, index=False)
    print(f"Resumes: {len(df)} rows saved to data/processed/resumes_clean.csv")


def preprocess_onet():
    # Each core O*NET attribute file contains attributes mapped to occupations via O*NET-SOC Code.
    # We filter to Scale ID = IM (Importance) and Data Value >= 3.0 to keep only attributes
    # that are meaningfully important for each occupation — this reduces noise.
    # Work Styles has no Scale ID column so all its rows are included.
    # NOTE: 122 of the 1,016 occupations in Occupation Data.xlsx have no rows surviving
    # this filter (mostly "All Other" catch-alls and some newer roles like Blockchain Engineers).
    # Those occupations are dropped during the merge below and will not appear in results.
    frames = []
    for path in ONET_PROFILE_FILES:
        df = pd.read_excel(path)
        if 'Scale ID' in df.columns:
            df = df[df['Scale ID'] == 'IM']
            df = df[df['Data Value'] >= 3.0]
        frames.append(df[['O*NET-SOC Code', 'Element Name']])

    combined = pd.concat(frames, ignore_index=True)

    # Group by occupation and concatenate all element names into one text string.
    # This creates a single "document" per occupation in the same format as a resume,
    # enabling direct TF-IDF cosine similarity comparison between resumes and occupations.
    profiles = (
        combined
        .groupby('O*NET-SOC Code')['Element Name']
        .apply(join_unique)
        .reset_index()
        .rename(columns={'Element Name': 'attribute_text'})
    )

    software = pd.read_excel(ONET_SOFTWARE_SKILLS_XLSX)
    software['software_text'] = software[['Element Name', 'Workplace Example']].fillna('').agg(' '.join, axis=1)
    software_profiles = (
        software
        .groupby('O*NET-SOC Code')['software_text']
        .apply(join_unique)
        .reset_index()
    )
    profiles = profiles.merge(software_profiles, on='O*NET-SOC Code', how='left')

    # Join occupation titles and descriptions from Occupation Data.
    # Uses inner-style left merge — occupations with no skill data are excluded.
    occ = pd.read_excel(ONET_OCCUPATION_XLSX)[['O*NET-SOC Code', 'Title', 'Description']]
    profiles = profiles.merge(occ, on='O*NET-SOC Code', how='left')

    profiles['profile_text'] = profiles[
        ['Title', 'Description', 'attribute_text', 'software_text']
    ].fillna('').agg(' '.join, axis=1)
    profiles['profile_text'] = profiles['profile_text'].apply(clean_text)
    profiles = profiles[['O*NET-SOC Code', 'Title', 'Description', 'profile_text']]
    profiles.to_csv(ONET_PROFILES_CSV, index=False)
    print(f"O*NET: {len(profiles)} occupation profiles saved to data/processed/onet_profiles.csv")
    print(f"  Note: {1016 - len(profiles)} occupations from Occupation Data.xlsx had no skill data after filtering and were excluded.")


if __name__ == '__main__':
    preprocess_resumes()
    preprocess_onet()
