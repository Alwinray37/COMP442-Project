import pandas as pd
import re

def load_and_parse_jobs(filepath="job_postings.csv", sample_size=None):
    try:
        df = pd.read_csv(filepath)
        
        df = df.dropna(subset=['description'])
        
        if sample_size:
            df = df.head(sample_size)
            
        parsed_jobs = []
        
        for index, row in df.iterrows():
            raw_desc = str(row['description'])
            
            clean_desc = re.sub(r'\W+', ' ', raw_desc).lower()
            
            parsed_jobs.append({
                "job_id": row.get('job_id', index),
                "title": row.get('title', 'Unknown Title'),
                "clean_description": clean_desc
            })
            
        print(f"Successfully loaded and parsed {len(parsed_jobs)} job postings!")
        return parsed_jobs
        
    except FileNotFoundError:
        print(f"File not found: {filepath}. Please check the path.")
        return []