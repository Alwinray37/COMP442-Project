import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from services.skill_rules import skill_aliases, transfer_skill_keywords

# Load O*NET Database into Memory ONCE
print("Loading O*NET Excel databases into memory...")
try:
    occupations_df = pd.read_excel("../Occupation Data.xlsx")
    software_df = pd.read_excel("../Software Skills.xlsx")
    transferable_df = pd.read_excel("../Transferable Skills.xlsx")
except Exception as e:
    print(f"Warning: Unable to load O*NET Excel files. Error: {e}")
    occupations_df, software_df, transferable_df = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

# Matching TF-IDF with Cosine Similarity (AI Core)
def recommend(resume_text, job_descriptions_list, top_k=5):
    documents = [resume_text] + job_descriptions_list
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(documents)
    
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    top_indices = similarities.argsort()[-top_k:][::-1]
    
    results = [{"job_index": int(i), "match_score": float(similarities[i])} for i in top_indices]
    return results

# O*NET Skill Matching Logic (Extended Functionality)
def build_skills_database():
    if software_df.empty or transferable_df.empty:
        return []
        
    tech_skills = software_df['Workplace Example'].dropna().unique().tolist()
    soft_skills = transferable_df['Element Name'].dropna().unique().tolist()
    
    master_skills_list = tech_skills + soft_skills
    master_skills_list = [str(skill).lower() for skill in master_skills_list]
    return master_skills_list


def count_skills_in_resume(resume_text, master_skills_list):
    resume_text_lower = resume_text.lower()
    matched_skills = set() 
    
    for skill in master_skills_list:
        if not skill: continue
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, resume_text_lower):
            matched_skills.add(skill)
            
    for real_skill, aliases in skill_aliases.items():
        for alias in aliases:
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, resume_text_lower):
                matched_skills.add(real_skill)
                break 
                
    for real_skill, keywords in transfer_skill_keywords.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, resume_text_lower):
                matched_skills.add(real_skill)
                break
                
    return {
        "skill_match_count": len(matched_skills),
        "found_skills": list(matched_skills)
    }


def analyze_skill_gap(target_job_title, user_found_skills):

    if occupations_df.empty or software_df.empty:
        return {"error": "O*NET database is not loaded in memory."}

    try:
        matched_jobs = occupations_df[occupations_df['Title'].str.contains(target_job_title, case=False, na=False)]
        
        if matched_jobs.empty:
            matched_jobs = occupations_df[occupations_df['Description'].str.contains(target_job_title, case=False, na=False)]
            
        if matched_jobs.empty:
            first_word = target_job_title.split()[0] 
            matched_jobs = occupations_df[occupations_df['Title'].str.contains(first_word, case=False, na=False)]

        if matched_jobs.empty:
            return {"error": f"Could not find standard O*NET requirements for '{target_job_title}'"}

        job_code = matched_jobs.iloc[0]['O*NET-SOC Code']
        official_title = matched_jobs.iloc[0]['Title']

        job_specific_software = software_df[software_df['O*NET-SOC Code'] == job_code]
        required_skills = job_specific_software['Workplace Example'].dropna().unique().tolist()
        required_skills = [skill.lower() for skill in required_skills]

        user_skills_lower = [skill.lower() for skill in user_found_skills]
        
        missing_skills = [skill for skill in required_skills if skill not in user_skills_lower]

        return {
            "official_job_title": official_title,
            "total_required_skills": len(required_skills),
            "missing_skill_count": len(missing_skills),
            "recommended_skills_to_add": missing_skills[:10] 
        }

    except Exception as e:
        print(f"Error analyzing skill gap: {e}")
        return {"error": str(e)}