from datetime import datetime

from app import extensions


def create_application(application_data):
    application = {
        "user_id": application_data["user_id"],
        "job_id": application_data["job_id"],
        "status": "applied",
        "applied_at": datetime.utcnow()
    }

    return extensions.db.applications.insert_one(application)