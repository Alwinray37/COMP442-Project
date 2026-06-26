import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))
sys.path.append(str(ROOT / "backend"))

from project_paths import RESUME_CSV
from services.resume_parser import parse_resume_text
from app import app


class SmokeTests(unittest.TestCase):
    def test_resume_dataset_path_exists(self):
        self.assertTrue(RESUME_CSV.exists())

    def test_resume_text_parser_returns_clean_text(self):
        parsed = parse_resume_text("Python developer with SQL experience.")
        self.assertEqual(parsed["clean_text"], "python developer with sql experience ")
        self.assertGreater(parsed["word_count"], 0)

    def test_status_endpoint(self):
        client = app.test_client()
        response = client.get("/status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")


if __name__ == "__main__":
    unittest.main()
