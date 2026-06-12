from flask import Flask, jsonify, request

# Import modules from the services folder
from services.job_parser import load_and_parse_jobs
from services.resume_parser import parse_resume_text, parse_resume_pdf
from services.recommender import recommend, build_skills_database, count_skills_in_resume, analyze_skill_gap

app = Flask(__name__)

print("Loading job database, please wait...")
job_csv_path = "../job_postings.csv"
parsed_jobs = load_and_parse_jobs(filepath=job_csv_path)

job_descriptions = [job['clean_description'] for job in parsed_jobs]
job_titles = [job['title'] for job in parsed_jobs]
print("Job database loaded successfully!")

print("Loading master skills dictionary...")
master_skills = build_skills_database()
print("Master skills loaded successfully! API is ready.")

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "ok", "message": "Backend is running!"})

@app.route('/api/match', methods=['POST'])
def match_jobs():
    parsed_data = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename.endswith('.pdf'):
            pdf_bytes = file.read()
            parsed_data = parse_resume_pdf(pdf_bytes)
        else:
            return jsonify({"status": "error", "message": "Please upload a .pdf file"}), 400
    elif request.is_json:
        data = request.json
        user_resume = data.get("resume_text", "")
        parsed_data = parse_resume_text(user_resume)
    else:
        return jsonify({"status": "error", "message": "Invalid request format."}), 400

    if not parsed_data or not parsed_data["clean_text"].strip():
         return jsonify({"status": "error", "message": "Could not extract valid text from the resume"}), 400

    top_matches = recommend(parsed_data["clean_text"], job_descriptions, top_k=5)
    
    results = []
    for match in top_matches:
        idx = match["job_index"]
        results.append({
            "job_title": job_titles[idx],
            "match_score": round(match["match_score"], 4)
        })
        
    return jsonify({"status": "success", "matches": results})

@app.route('/api/analyze_gap', methods=['POST'])
def analyze_gap():
    parsed_data = None
    target_job = ""

    if 'file' in request.files:
        file = request.files['file']
        target_job = request.form.get("target_job_title", "") 
        
        if file.filename.endswith('.pdf'):
            pdf_bytes = file.read()
            parsed_data = parse_resume_pdf(pdf_bytes)
        else:
            return jsonify({"status": "error", "message": "Please upload a .pdf file"}), 400

    elif request.is_json:
        data = request.json
        user_resume = data.get("resume_text", "")
        target_job = data.get("target_job_title", "")
        parsed_data = parse_resume_text(user_resume)
        
    else:
        return jsonify({"status": "error", "message": "Invalid request format."}), 400

    if not parsed_data or not parsed_data["clean_text"].strip():
         return jsonify({"status": "error", "message": "Could not extract valid text from the resume"}), 400
    if not target_job:
         return jsonify({"status": "error", "message": "Please provide a target_job_title"}), 400

    user_skills_result = count_skills_in_resume(parsed_data["clean_text"], master_skills)
    found_skills = user_skills_result["found_skills"]

    gap_analysis = analyze_skill_gap(target_job, found_skills)

    if "error" in gap_analysis:
         return jsonify({"status": "error", "message": gap_analysis["error"]}), 404

    return jsonify({
        "status": "success",
        "target_role": gap_analysis["official_job_title"],
        "user_current_skills": found_skills,
        "missing_skills_to_learn": gap_analysis["recommended_skills_to_add"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)