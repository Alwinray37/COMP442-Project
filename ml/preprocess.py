import pandas as pd
import re
import os

RAW = os.path.join(os.path.dirname(__file__), '../data/raw')
PROCESSED = os.path.join(os.path.dirname(__file__), '../data/processed')

os.makedirs(PROCESSED, exist_ok=True)


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\W+', ' ', text)
    return text.strip()


def preprocess_resumes():
    df = pd.read_csv(os.path.join(RAW, 'Resume.csv'))
    df = df.drop_duplicates(subset='Resume_str')
    df = df.drop(columns=['Resume_html'])
    df['Resume_str'] = df['Resume_str'].apply(clean_text)
    df.to_csv(os.path.join(PROCESSED, 'resumes_clean.csv'), index=False)
    print(f"Resumes: {len(df)} rows saved to data/processed/resumes_clean.csv")


def preprocess_onet():
    skill_files = [
        'Essential Skills.xlsx',
        'Knowledge.xlsx',
        'Abilities.xlsx',
        'Work Activities.xlsx',
        'Work Styles.xlsx',
    ]

    frames = []
    for fname in skill_files:
        df = pd.read_excel(os.path.join(RAW, fname))
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

    # Join occupation titles from Occupation Data
    occ = pd.read_excel(os.path.join(RAW, 'Occupation Data.xlsx'))[['O*NET-SOC Code', 'Title']]
    profiles = profiles.merge(occ, on='O*NET-SOC Code', how='left')

    profiles['profile_text'] = profiles['profile_text'].apply(clean_text)
    profiles = profiles[['O*NET-SOC Code', 'Title', 'profile_text']]
    profiles.to_csv(os.path.join(PROCESSED, 'onet_profiles.csv'), index=False)
    print(f"O*NET: {len(profiles)} occupation profiles saved to data/processed/onet_profiles.csv")


if __name__ == '__main__':
    preprocess_resumes()
    preprocess_onet()
