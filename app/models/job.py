from datetime import datetime

from app import extensions


def create_job(job_data):
    job = {
        "title": job_data["title"],
        "company": job_data["company"],
        "description": job_data.get("description", ""),
        "location": job_data.get("location", ""),
        "salary": job_data.get("salary", ""),
        "eligibility": job_data.get("eligibility", {}),
        "skills_required": job_data.get("skills_required", []),
        "application_deadline": job_data.get("application_deadline"),
        "created_at": datetime.utcnow()
    }

    return extensions.db.jobs.insert_one(job)