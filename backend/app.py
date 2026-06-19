from flask import Flask, jsonify, request
from services.resume_parser import parse_resume_text, parse_resume_pdf
from services.recommender import predict_job_titles

app = Flask(__name__)

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "ok", "message": "Backend is running!"})

@app.route('/api/match', methods=['POST'])
def match_jobs():
    parsed_data = None

    if 'file' in request.files:
        file = request.files['file']
        if not file.filename.endswith('.pdf'):
            return jsonify({"status": "error", "message": "Please upload a .pdf file"}), 400
        parsed_data = parse_resume_pdf(file.read())
    elif request.is_json:
        data = request.json
        parsed_data = parse_resume_text(data.get("resume_text", ""))
    else:
        return jsonify({"status": "error", "message": "Invalid request format."}), 400

    if not parsed_data or not parsed_data["clean_text"].strip():
        return jsonify({"status": "error", "message": "Could not extract valid text from the resume"}), 400

    matches = predict_job_titles(parsed_data["clean_text"], top_k=5)
    return jsonify({"status": "success", "matches": matches})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
