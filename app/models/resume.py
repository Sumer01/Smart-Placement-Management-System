from datetime import datetime

from app import extensions


def create_resume_analysis(analysis_data):
    analysis = {
        "user_id": analysis_data["user_id"],
        "filename": analysis_data.get("filename", ""),
        "skills": analysis_data.get("skills", []),
        "score": analysis_data.get("score", 0),
        "suggestions": analysis_data.get("suggestions", []),
        "analyzed_at": datetime.utcnow()
    }

    return extensions.db.resume_analyses.insert_one(analysis)