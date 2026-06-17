import re
import io
from PyPDF2 import PdfReader
from config import RESUME_CSV, JOB_POSTINGS_CSV

def parse_resume_text(record_text):
    clean_text = re.sub(r'\W+', ' ', record_text).lower()
    
    words = re.findall(r"\b\w+(?:\.\w+)*\b", record_text)
    word_count = len(words)
    
    return {
        "word_count": word_count,
        "clean_text": clean_text
    }

def parse_resume_pdf(pdf_file_bytes):
    """Read and clean PDF resumes (front-end file upload mode)"""
    text = ""
    try:
        reader = PdfReader(io.BytesIO(pdf_file_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
                
        return parse_resume_text(text)
    except Exception as e:
        print(f"PDF parsing error: {e}")
        return {"raw_length": 0, "clean_text": ""}