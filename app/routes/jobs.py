from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.models.job import create_job
from app import extensions


jobs_bp = Blueprint("jobs", __name__)


# =========================
# ADMIN CHECK
# =========================
def check_admin():
    user_id = get_jwt_identity()

    if not ObjectId.is_valid(user_id):
        return False

    user = extensions.db.users.find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        return False

    return user.get("role") == "admin"


# =========================
# CREATE JOB - ADMIN ONLY
# =========================
@jobs_bp.route("/", methods=["POST"])
@jwt_required()
def add_job():
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        title = data.get("title", "").strip()
        company = data.get("company", "").strip()

        if not title:
            return {
                "error": "Job title is required"
            }, 400

        if not company:
            return {
                "error": "Company name is required"
            }, 400

        job_data = {
            "title": title,
            "company": company,
            "description": data.get("description", ""),
            "location": data.get("location", ""),
            "salary": data.get("salary", ""),
            "eligibility": data.get("eligibility", {}),
            "skills_required": data.get("skills_required", []),
            "application_deadline": data.get("application_deadline")
        }

        result = create_job(job_data)

        return {
            "message": "Job created successfully",
            "job_id": str(result.inserted_id)
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET ALL JOBS
# STUDENT + ADMIN
# =========================
@jobs_bp.route("/", methods=["GET"])
@jwt_required()
def get_jobs():
    try:
        jobs = list(
            extensions.db.jobs.find().sort(
                "created_at",
                -1
            )
        )

        for job in jobs:
            job["_id"] = str(job["_id"])

        return {
            "message": "Jobs fetched successfully",
            "jobs": jobs
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET SINGLE JOB
# STUDENT + ADMIN
# =========================
@jobs_bp.route("/<job_id>", methods=["GET"])
@jwt_required()
def get_job(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        job = extensions.db.jobs.find_one({
            "_id": ObjectId(job_id)
        })

        if not job:
            return {
                "error": "Job not found"
            }, 404

        job["_id"] = str(job["_id"])

        return {
            "message": "Job fetched successfully",
            "job": job
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# UPDATE JOB - ADMIN ONLY
# =========================
@jobs_bp.route("/<job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        existing_job = extensions.db.jobs.find_one({
            "_id": ObjectId(job_id)
        })

        if not existing_job:
            return {
                "error": "Job not found"
            }, 404

        update_data = {
            "title": data.get(
                "title",
                existing_job.get("title", "")
            ),
            "company": data.get(
                "company",
                existing_job.get("company", "")
            ),
            "description": data.get(
                "description",
                existing_job.get("description", "")
            ),
            "location": data.get(
                "location",
                existing_job.get("location", "")
            ),
            "salary": data.get(
                "salary",
                existing_job.get("salary", "")
            ),
            "eligibility": data.get(
                "eligibility",
                existing_job.get("eligibility", {})
            ),
            "skills_required": data.get(
                "skills_required",
                existing_job.get("skills_required", [])
            ),
            "application_deadline": data.get(
                "application_deadline",
                existing_job.get("application_deadline")
            )
        }

        if not str(update_data["title"]).strip():
            return {
                "error": "Job title is required"
            }, 400

        if not str(update_data["company"]).strip():
            return {
                "error": "Company name is required"
            }, 400

        extensions.db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )

        return {
            "message": "Job updated successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# DELETE JOB - ADMIN ONLY
# =========================
@jobs_bp.route("/<job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        result = extensions.db.jobs.delete_one({
            "_id": ObjectId(job_id)
        })

        if result.deleted_count == 0:
            return {
                "error": "Job not found"
            }, 404

        return {
            "message": "Job deleted successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# CHECK ELIGIBILITY
# STUDENT + ADMIN
# =========================
@jobs_bp.route("/<job_id>/eligibility", methods=["GET"])
@jwt_required()
def check_eligibility(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        user_id = get_jwt_identity()

        job = extensions.db.jobs.find_one({
            "_id": ObjectId(job_id)
        })

        if not job:
            return {
                "error": "Job not found"
            }, 404

        student = extensions.db.students.find_one({
            "user_id": ObjectId(user_id)
        })

        if not student:
            return {
                "error": "Student profile not found"
            }, 404

        eligibility = job.get("eligibility", {})

        required_cgpa = eligibility.get("min_cgpa")
        required_course = eligibility.get("course")

        student_cgpa = student.get("cgpa")
        student_course = student.get("course", "")

        student_skills = [
            str(skill).lower()
            for skill in student.get("skills", [])
        ]

        required_skills = [
            str(skill).lower()
            for skill in job.get("skills_required", [])
        ]

        # CGPA
        cgpa_eligible = True

        if required_cgpa is not None:
            if student_cgpa is None:
                cgpa_eligible = False
            else:
                cgpa_eligible = (
                    float(student_cgpa) >= float(required_cgpa)
                )

        # Course
        course_eligible = True

        if required_course:
            course_eligible = (
                str(student_course).strip().lower()
                == str(required_course).strip().lower()
            )

        # Skills
        missing_skills = [
            skill
            for skill in required_skills
            if skill not in student_skills
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
