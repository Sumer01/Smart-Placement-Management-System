from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.models.application import create_application
from app import extensions


applications_bp = Blueprint("applications", __name__)


# =========================
# APPLY FOR JOB
# =========================
@applications_bp.route("/", methods=["POST"])
@jwt_required()
def apply_for_job():
    try:
        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        job_id = data.get("job_id", "").strip()

        if not job_id:
            return {
                "error": "Job ID is required"
            }, 400

        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID"
            }, 400

        user_id = get_jwt_identity()

        # Check job exists
        job = extensions.db.jobs.find_one({
            "_id": ObjectId(job_id)
        })

        if not job:
            return {
                "error": "Job not found"
            }, 404

        # Check student profile
        student = extensions.db.students.find_one({
            "user_id": user_id
        })

        if not student:
            return {
                "error": "Student profile not found"
            }, 404

        # Check duplicate application
        existing_application = extensions.db.applications.find_one({
            "user_id": user_id,
            "job_id": job_id
        })

        if existing_application:
            return {
                "error": "You have already applied for this job"
            }, 409

        # =========================
        # CHECK ELIGIBILITY
        # =========================
        eligibility = job.get("eligibility", {})

        required_cgpa = eligibility.get("min_cgpa")
        required_course = eligibility.get("course")

        student_cgpa = student.get("cgpa")
        student_course = student.get("course", "")

        # CGPA check
        if required_cgpa is not None:
            if student_cgpa is None:
                return {
                    "error": "You are not eligible for this job"
                }, 403

            if float(student_cgpa) < float(required_cgpa):
                return {
                    "error": "You are not eligible for this job"
                }, 403

        # Course check
        if required_course:
            if student_course.strip().lower() != str(
                required_course
            ).strip().lower():
                return {
                    "error": "You are not eligible for this job"
                }, 403

        # Skills check
        student_skills = [
            skill.lower()
            for skill in student.get("skills", [])
        ]

        required_skills = [
            skill.lower()
            for skill in job.get("skills_required", [])
        ]

        missing_skills = [
            skill
            for skill in required_skills
            if skill not in student_skills
        ]

        if missing_skills:
            return {
                "error": "You are not eligible for this job",
                "missing_skills": missing_skills
            }, 403

        # =========================
        # CREATE APPLICATION
        # =========================
        result = create_application({
            "user_id": user_id,
            "job_id": job_id
        })

        return {
            "message": "Application submitted successfully",
            "application_id": str(result.inserted_id)
        }, 201

    except (ValueError, TypeError):
        return {
            "error": "Invalid eligibility data"
        }, 400

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET MY APPLICATIONS
# =========================
@applications_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_applications():
    try:
        user_id = get_jwt_identity()

        applications = list(
            extensions.db.applications.find({
                "user_id": user_id
            }).sort(
                "applied_at",
                -1
            )
        )

        for application in applications:
            application["_id"] = str(application["_id"])

        return {
            "message": "Applications fetched successfully",
            "applications": applications
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET SINGLE APPLICATION
# =========================
@applications_bp.route("/<application_id>", methods=["GET"])
@jwt_required()
def get_application(application_id):
    try:
        if not ObjectId.is_valid(application_id):
            return {
                "error": "Invalid application ID"
            }, 400

        user_id = get_jwt_identity()

        application = extensions.db.applications.find_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })

        if not application:
            return {
                "error": "Application not found"
            }, 404

        application["_id"] = str(application["_id"])

        return {
            "message": "Application fetched successfully",
            "application": application
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# DELETE APPLICATION
# =========================
@applications_bp.route("/<application_id>", methods=["DELETE"])
@jwt_required()
def delete_application(application_id):
    try:
        if not ObjectId.is_valid(application_id):
            return {
                "error": "Invalid application ID"
            }, 400

        user_id = get_jwt_identity()

        result = extensions.db.applications.delete_one({
            "_id": ObjectId(application_id),
            "user_id": user_id
        })

        if result.deleted_count == 0:
            return {
                "error": "Application not found"
            }, 404

        return {
            "message": "Application deleted successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500