import requests

url = "http://127.0.0.1:5000/api/match"
pdf_path = "test_resume.pdf"

print("Testing PDF file upload mode...")

try:
    with open(pdf_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)

    if response.status_code == 200:
        print("Successfully received AI matchmaking results:")
        import json
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Test failed, status code: {response.status_code}")
        print(response.text)

except FileNotFoundError:
    print(f"Error: The test PDF file '{pdf_path}' could not be found. Please place a PDF resume in the backend folder first.")