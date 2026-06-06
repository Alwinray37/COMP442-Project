
# COMP442-Project

Project for COMP442 that demonstrates reading and preparing resume and job-posting datasets using pandas.

## Project Overview

This repository contains code and data for working with resumes and job postings. The goal is to provide a minimal starting point for experiments such as matching resumes to job descriptions, exploratory data analysis, and feature extraction.

## Requirements

- Python 3.8+
- pandas

Install requirements with:

```
pip install pandas
```

## Data

Place the CSV files in the repository root (or update paths in the code):

- `Resume.csv` — resume dataset
- `job_postings.csv` — job postings dataset

## Usage

A minimal example using pandas to load the two CSV files:

```python
import pandas as pd

resume_df = pd.read_csv("Resume.csv")
jobs_df = pd.read_csv("job_postings.csv")

print(resume_df.head())
print(jobs_df.head())
```

Replace `print` calls with your analysis, e.g., merging, text processing, or model inputs.

## Project Structure

- `README.md` — this file
- `Resume.csv` — (data file, not included)
- `job_postings.csv` — (data file, not included)

## Contributing

Open issues or PRs for fixes and feature requests. Keep changes minimal and include tests or examples when possible.

## License

This repository does not include a license; add one if you plan to share the code publicly.
