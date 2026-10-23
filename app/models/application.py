
from datetime import datetime
from bson import ObjectId

from app import extensions


def create_application(application_data):
    user_id = application_data["user_id"]
    job_id = application_data["job_id"]

    if not isinstance(user_id, ObjectId):
        user_id = ObjectId(user_id)

    if not isinstance(job_id, ObjectId):
        job_id = ObjectId(job_id)

    application = {
        "user_id": user_id,
        "job_id": job_id,
        "status": "applied",
        "applied_at": datetime.utcnow()
    }

    return extensions.db.applications.insert_one(application)
