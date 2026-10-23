
from bson import ObjectId
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.student import create_student_profile
from app import extensions


student_bp = Blueprint("student", __name__)


def get_user_object_id():
    """Convert the authenticated JWT identity to a MongoDB ObjectId."""
    user_id = get_jwt_identity()

    if not ObjectId.is_valid(user_id):
        return None

    return ObjectId(user_id)


# =========================
# CREATE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_profile():
    try:
        user_object_id = get_user_object_id()

        if user_object_id is None:
            return {"error": "Invalid user ID"}, 400

        data = request.get_json()

        if not data:
            return {"error": "Request body is required"}, 400

        existing_profile = extensions.db.students.find_one({
            "user_id": user_object_id
        })

        if existing_profile:
            return {"error": "Student profile already exists"}, 409

        student_data = {
            "user_id": user_object_id,
            "name": "",
            "phone": data.get("phone", ""),
            "gender": data.get("gender", ""),
            "course": data.get("course", "MCA"),
            "degree": data.get("degree", data.get("course", "MCA")),
            "department": data.get("department", "Computer Applications"),
            "college": data.get("college", "CUSAT"),
            "semester": data.get("semester", ""),
            "cgpa": data.get("cgpa"),
            "backlogs": data.get("backlogs", 0),
            "skills": data.get("skills", []),
            "resume_name": data.get("resumeName", ""),
            "resume_url": data.get("resume_url", ""),
            "placement_status": "Not Placed",
            "verified": 1,
            "is_registered": 1
        }

        result = create_student_profile(student_data)

        return {
            "message": "Student profile created successfully",
            "profile_id": str(result.inserted_id)
        }, 201

    except Exception as e:
        print(f"Create student profile error: {e}")
        return {"error": "Unable to create student profile"}, 500


# =========================
# GET STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_object_id = get_user_object_id()

        if user_object_id is None:
            return {"error": "Invalid user ID"}, 400

        profile = extensions.db.students.find_one({
            "user_id": user_object_id
        })

        if not profile:
            return {"error": "Student profile not found"}, 404

        profile["_id"] = str(profile["_id"])
        profile["user_id"] = str(profile["user_id"])

        return {
            "message": "Student profile fetched successfully",
            "profile": profile
        }, 200

    except Exception as e:
        print(f"Get student profile error: {e}")
        return {"error": "Unable to fetch student profile"}, 500


# =========================
# UPDATE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        user_object_id = get_user_object_id()

        if user_object_id is None:
            return {"error": "Invalid user ID"}, 400

        data = request.get_json()

        if not data:
            return {"error": "Request body is required"}, 400

        existing_profile = extensions.db.students.find_one({
            "user_id": user_object_id
        })

        new_name = data.get("fullName") or data.get("name")

        if new_name:
            extensions.db.users.update_one(
                {"_id": user_object_id},
                {"$set": {"name": new_name}}
            )

        def existing_value(key, default=None):
            if existing_profile is None:
                return default
            return existing_profile.get(key, default)

        cgpa_value = data.get("cgpa")
        if cgpa_value is not None and str(cgpa_value).strip() != "":
            cgpa_value = float(cgpa_value)
        else:
            cgpa_value = existing_value("cgpa", 0.0)

        backlogs_value = data.get("backlogs")
        if backlogs_value is not None and str(backlogs_value).strip() != "":
            backlogs_value = int(backlogs_value)
        else:
            backlogs_value = existing_value("backlogs", 0)

        update_data = {
            "user_id": user_object_id,
            "name": new_name or existing_value("name", ""),
            "roll_no": data.get("rollNo") or data.get("roll_no")
                       or existing_value("roll_no"),
            "phone": data.get("phone") if data.get("phone") is not None
                     else existing_value("phone", ""),
            "gender": data.get("gender") if data.get("gender") is not None
                      else existing_value("gender", ""),
            "location": data.get("location") if data.get("location") is not None
                        else existing_value("location", ""),
            "degree": data.get("degree") or data.get("course")
                      or existing_value("degree", "MCA"),
            "course": data.get("course") or existing_value("course", "MCA"),
            "department": data.get("department")
                          or existing_value("department", "Computer Applications"),
            "college": data.get("college") or existing_value("college", "CUSAT"),
            "semester": data.get("semester") if data.get("semester") is not None
                        else existing_value("semester", ""),
            "cgpa": cgpa_value,
            "backlogs": backlogs_value,
            "skills": data.get("skills") if data.get("skills") is not None
                      else existing_value("skills", []),
            "resume_name": data.get("resumeName")
                           or existing_value("resume_name", ""),
            "resume_url": data.get("resume_url")
                          or existing_value("resume_url", "")
        }

        if not existing_profile:
            extensions.db.students.insert_one(update_data)
        else:
            extensions.db.students.update_one(
                {"user_id": user_object_id},
                {"$set": update_data}
            )

        return {
            "message": "Student profile updated successfully"
        }, 200

    except (ValueError, TypeError):
        return {"error": "Invalid CGPA or backlogs value"}, 400

    except Exception as e:
        print(f"Update student profile error: {e}")
        return {"error": "Unable to update student profile"}, 500


# =========================
# DELETE STUDENT PROFILE
# =========================
@student_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_profile():
    try:
        user_object_id = get_user_object_id()

        if user_object_id is None:
            return {"error": "Invalid user ID"}, 400

        result = extensions.db.students.delete_one({
            "user_id": user_object_id
        })

        if result.deleted_count == 0:
            return {"error": "Student profile not found"}, 404

        return {
            "message": "Student profile deleted successfully"
        }, 200

    except Exception as e:
        print(f"Delete student profile error: {e}")
        return {"error": "Unable to delete student profile"}, 500
