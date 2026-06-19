import pandas as pd
import re
import os

RAW = os.path.join(os.path.dirname(__file__), '../data/raw')
PROCESSED = os.path.join(os.path.dirname(__file__), '../data/processed')

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

def preprocess_jobs():
    df = pd.read_csv('hf://datasets/lukebarousse/data_jobs/data_jobs.csv')
    drop_cols = ['job_via', 'job_posting_url', 'job_no_degree_mention',
                 'job_health_insurance', 'salary_rate', 'salary_hour_avg',
                 'search_location', 'job_posted_date']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])
    df = df.dropna(subset=['job_title_short', 'job_skills'])
    df['job_skills'] = df['job_skills'].apply(clean_text)
    df.to_csv(os.path.join(PROCESSED, 'jobs_clean.csv'), index=False)
    print(f"Jobs: {len(df)} rows saved to data/processed/jobs_clean.csv")

if __name__ == '__main__':
    preprocess_resumes()
    preprocess_jobs()
