import requests
import json

url = "http://127.0.0.1:5000/api/analyze_gap"
pdf_path = "Judy Kreiner.pdf"

print(f"Reading {pdf_path} and performing AI skills gap analysis...")

try:
    with open(pdf_path, "rb") as f:
        files = {"file": f}
        form_data = {"target_job_title": "Business Analyst"}

        response = requests.post(url, files=files, data=form_data)

    if response.status_code == 200:
        print("\n✅ Test successful! The following are the AI ​​analysis results.：")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"\n❌ Test failed, status code: {response.status_code}")
        print(response.text)

except FileNotFoundError:
    print(f"The test file '{pdf_path}' could not be found. Please make sure it is in the correct location.")