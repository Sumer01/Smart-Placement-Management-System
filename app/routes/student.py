from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.student import create_student_profile
from app import extensions


student_bp = Blueprint("student", __name__)


# =========================
# CREATE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_profile():
    try:
        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        user_id = get_jwt_identity()

        # Check if profile already exists
        existing_profile = extensions.db.students.find_one({
            "user_id": user_id
        })

        if existing_profile:
            return {
                "error": "Student profile already exists"
            }, 409

        student_data = {
            "user_id": user_id,
            "phone": data.get("phone", ""),
            "gender": data.get("gender", ""),
            "course": data.get("course", "MCA"),
            "college": data.get("college", ""),
            "semester": data.get("semester", ""),
            "cgpa": data.get("cgpa"),
            "skills": data.get("skills", []),
            "resume_url": data.get("resume_url", "")
        }

        result = create_student_profile(student_data)

        return {
            "message": "Student profile created successfully",
            "profile_id": str(result.inserted_id)
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            pass

        profile = extensions.db.students.find_one({
            "user_id": user_id
        })

        if not profile:
            return {
                "error": "Student profile not found"
            }, 404

        profile["_id"] = str(profile["_id"])

        return {
            "message": "Student profile fetched successfully",
            "profile": profile
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# UPDATE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            pass

        # Update user name if provided
        new_name = data.get("fullName") or data.get("name")
        if new_name:
            extensions.db.users.update_one(
                {"_id": user_id},
                {"$set": {"name": new_name}}
            )

        # Check if profile exists; if not, create it
        existing_profile = extensions.db.students.find_one({
            "user_id": user_id
        })

        update_data = {
            "user_id": user_id,
            "name": new_name or (existing_profile.get("name") if existing_profile else ""),
            "roll_no": data.get("rollNo") or data.get("roll_no") or (existing_profile.get("roll_no") if existing_profile else None),
            "phone": data.get("phone") or (existing_profile.get("phone") if existing_profile else ""),
            "gender": data.get("gender") if data.get("gender") is not None else (existing_profile.get("gender", "") if existing_profile else ""),
            "location": data.get("location") or (existing_profile.get("location") if existing_profile else ""),
            "degree": data.get("degree") or data.get("course") or (existing_profile.get("degree") if existing_profile else "MCA"),
            "department": data.get("department") or (existing_profile.get("department") if existing_profile else "Computer Applications"),
            "college": data.get("college") or (existing_profile.get("college") if existing_profile else "CUSAT"),
            "semester": data.get("semester") or (existing_profile.get("semester") if existing_profile else ""),
            "cgpa": float(data.get("cgpa")) if (data.get("cgpa") is not None and str(data.get("cgpa")).strip() != "") else (existing_profile.get("cgpa") if existing_profile else 0.0),
            "backlogs": int(data.get("backlogs") or 0) if (existing_profile is None or "backlogs" in data) else existing_profile.get("backlogs", 0),
            "skills": data.get("skills") if data.get("skills") is not None else (existing_profile.get("skills", []) if existing_profile else []),
            "resume_name": data.get("resumeName") or (existing_profile.get("resume_name") if existing_profile else ""),
            "resume_url": data.get("resumeName") or data.get("resume_url") or (existing_profile.get("resume_url") if existing_profile else "")
        }

        if not existing_profile:
            extensions.db.students.insert_one(update_data)
        else:
            extensions.db.students.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )

        return {
            "message": "Student profile updated successfully in MySQL database"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# DELETE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_profile():
    try:
        user_id = get_jwt_identity()

        result = extensions.db.students.delete_one({
            "user_id": user_id
        })

        if result.deleted_count == 0:
            return {
                "error": "Student profile not found"
            }, 404

        return {
            "message": "Student profile deleted successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500