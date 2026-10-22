from flask import Blueprint, request
from bson import ObjectId

from app import extensions


public_bp = Blueprint("public", __name__)


# =========================
# GET PUBLIC JOBS
# =========================
@public_bp.route("/jobs", methods=["GET"])
def get_public_jobs():
    try:
        jobs = list(
            extensions.db.jobs.find(
                {},
                {
                    "title": 1,
                    "company": 1,
                    "description": 1,
                    "location": 1,
                    "salary": 1,
                    "eligibility": 1,
                    "skills_required": 1,
                    "application_deadline": 1,
                    "created_at": 1
                }
            ).sort(
                "created_at",
                -1
            )
        )

        for job in jobs:
            job["_id"] = str(job["_id"])

        return {
            "message": "Public jobs fetched successfully",
            "jobs": jobs
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET PUBLIC SINGLE JOB
# =========================
@public_bp.route("/jobs/<job_id>", methods=["GET"])
def get_public_job(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        job = extensions.db.jobs.find_one(
            {
                "_id": ObjectId(job_id)
            },
            {
                "title": 1,
                "company": 1,
                "description": 1,
                "location": 1,
                "salary": 1,
                "eligibility": 1,
                "skills_required": 1,
                "application_deadline": 1,
                "created_at": 1
            }
        )

        if not job:
            return {
                "error": "Job not found"
            }, 404

        job["_id"] = str(job["_id"])

        return {
            "message": "Public job fetched successfully",
            "job": job
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# PUBLIC ELIGIBILITY CHECK
# =========================
@public_bp.route("/eligibility-check", methods=["POST"])
def public_eligibility_check():
    try:
        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        job_id = data.get("job_id", "").strip()
        student_cgpa = data.get("cgpa")
        student_course = data.get("course", "")
        student_skills = data.get("skills", [])

        if not job_id:
            return {
                "error": "Job ID is required"
            }, 400

        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        if student_cgpa is None:
            return {
                "error": "CGPA is required"
            }, 400

        if not isinstance(student_skills, list):
            return {
                "error": "Skills must be a list"
            }, 400

        job = extensions.db.jobs.find_one({
            "_id": ObjectId(job_id)
        })

        if not job:
            return {
                "error": "Job not found"
            }, 404

        eligibility = job.get("eligibility", {})

        required_cgpa = eligibility.get("min_cgpa")
        required_course = eligibility.get("course")

        # CGPA check
        cgpa_eligible = True

        if required_cgpa is not None:
            cgpa_eligible = (
                float(student_cgpa) >= float(required_cgpa)
            )

        # Course check
        course_eligible = True

        if required_course:
            course_eligible = (
                str(student_course).strip().lower()
                == str(required_course).strip().lower()
            )

        # Skills check
        student_skills_lower = [
            str(skill).strip().lower()
            for skill in student_skills
        ]

        required_skills = [
            str(skill).strip().lower()
            for skill in job.get("skills_required", [])
        ]

        missing_skills = [
            skill
            for skill in required_skills
            if skill not in student_skills_lower
        ]

        skills_eligible = len(missing_skills) == 0

        eligible = (
            cgpa_eligible
            and course_eligible
            and skills_eligible
        )

        return {
            "message": "Eligibility checked successfully",
            "eligible": eligible,
            "details": {
                "cgpa": {
                    "required": required_cgpa,
                    "student": student_cgpa,
                    "eligible": cgpa_eligible
                },
                "course": {
                    "required": required_course,
                    "student": student_course,
                    "eligible": course_eligible
                },
                "skills": {
                    "required": required_skills,
                    "missing": missing_skills,
                    "eligible": skills_eligible
                }
            }
        }, 200

    except (ValueError, TypeError):
        return {
            "error": "Invalid CGPA value"
        }, 400

    except Exception as e:
        return {
            "error": str(e)
        }, 500