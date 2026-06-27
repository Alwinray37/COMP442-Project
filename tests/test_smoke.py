import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))
sys.path.append(str(ROOT / "backend"))

from project_paths import ONET_SOFTWARE_SKILLS_XLSX, RESUME_CSV
from services.resume_parser import parse_resume_text
from app import app


class SmokeTests(unittest.TestCase):
    def test_resume_dataset_path_exists(self):
        self.assertTrue(RESUME_CSV.exists())

    def test_software_skills_path_exists(self):
        self.assertTrue(ONET_SOFTWARE_SKILLS_XLSX.exists())

    def test_resume_text_parser_returns_clean_text(self):
        parsed = parse_resume_text("Python developer with SQL experience.")
        self.assertEqual(parsed["clean_text"], "python developer with sql experience ")
        self.assertGreater(parsed["word_count"], 0)

    def test_status_endpoint(self):
        client = app.test_client()
        response = client.get("/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_match_endpoint_includes_job_descriptions(self):
        fake_result = {
            "category": "ENGINEERING",
            "category_confidence": 0.9,
            "category_candidates": [{"category": "ENGINEERING", "confidence": 0.9}],
            "matches": [
                {
                    "soc_code": "17-2141.00",
                    "job_title": "Mechanical Engineers",
                    "description": "Design mechanical devices and systems.",
                    "score": 0.1234,
                }
            ],
        }

        client = app.test_client()
        with patch("app.predict_job_titles", return_value=fake_result):
            response = client.post("/api/match", json={"resume_text": "python engineering design"})

        body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertIn("description", body["matches"][0])


if __name__ == "__main__":
    unittest.main()
