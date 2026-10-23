
from bson import ObjectId
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import extensions


admin_bp = Blueprint("admin", __name__)


def get_current_user():
    user_id = get_jwt_identity()

    if not user_id or not ObjectId.is_valid(user_id):
        return None

    return extensions.db.users.find_one({
        "_id": ObjectId(user_id)
    })


def check_admin():
    user = get_current_user()

    if not user:
        return None, {"error": "User not found"}, 404

    if user.get("role") != "admin":
        return None, {"error": "Admin access required"}, 403

    return user, None, None


# =========================
# ADMIN DASHBOARD
# =========================
@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        statistics = {
            "total_students": extensions.db.users.count_documents({
                "role": "student"
            }),
            "total_jobs": extensions.db.jobs.count_documents({}),
            "total_applications": extensions.db.applications.count_documents({}),
            "total_tests": extensions.db.tests.count_documents({})
        }

        return {
            "message": "Admin dashboard fetched successfully",
            "statistics": statistics
        }, 200

    except Exception as e:
        print(f"Admin dashboard error: {e}")
        return {"error": "Unable to fetch admin dashboard"}, 500


# =========================
# GET ALL STUDENTS
# =========================
@admin_bp.route("/students", methods=["GET"])
@jwt_required()
def get_all_students():
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        users = list(
            extensions.db.users.find(
                {"role": "student"},
                {"password": 0}
            )
        )

        profiles = list(extensions.db.students.find({}))
        profile_map = {
            str(profile.get("user_id")): profile
            for profile in profiles
        }

        enriched_students = []

        for account in users:
            user_id = str(account["_id"])
            profile = profile_map.get(user_id, {})

            enriched_students.append({
                "id": user_id,
                "_id": user_id,
                "user_id": user_id,
                "name": account.get("name") or profile.get("name", "Student"),
                "email": account.get("email", ""),
                "rollNo": profile.get("roll_no") or "Not Assigned",
                "degree": profile.get("degree") or profile.get("course") or "MCA",
                "department": profile.get("department") or "Computer Applications",
                "college": profile.get("college") or "CUSAT",
                "cgpa": str(profile.get("cgpa", 0.0)),
                "backlogs": profile.get("backlogs", 0),
                "phone": profile.get("phone") or "Not Provided",
                "gender": profile.get("gender") or "",
                "location": profile.get("location") or "Not Provided",
                "placementStatus": profile.get("placement_status") or "Not Placed",
                "verified": bool(profile.get("verified", False)),
                "isRegistered": bool(profile.get("is_registered", True)),
                "skills": profile.get("skills") or []
            })

        return {
            "message": "Students fetched successfully",
            "students": enriched_students
        }, 200

    except Exception as e:
        print(f"Get students error: {e}")
        return {"error": "Unable to fetch students"}, 500


# =========================
# GET ALL APPLICATIONS
# =========================
@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_all_applications():
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        applications = list(
            extensions.db.applications.find().sort("applied_at", -1)
        )

        for application in applications:
            application["_id"] = str(application["_id"])
            if isinstance(application.get("user_id"), ObjectId):
                application["user_id"] = str(application["user_id"])
            if isinstance(application.get("job_id"), ObjectId):
                application["job_id"] = str(application["job_id"])

        return {
            "message": "Applications fetched successfully",
            "applications": applications
        }, 200

    except Exception as e:
        print(f"Get applications error: {e}")
        return {"error": "Unable to fetch applications"}, 500


# =========================
# UPDATE APPLICATION STATUS
# =========================
@admin_bp.route("/applications/<application_id>", methods=["PUT"])
@jwt_required()
def update_application_status(application_id):
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        if not ObjectId.is_valid(application_id):
            return {"error": "Invalid application ID"}, 400

        data = request.get_json()

        if not data:
            return {"error": "Request body is required"}, 400

        status = data.get("status", "").strip().lower()

        allowed_statuses = [
            "applied",
            "under review",
            "shortlisted",
            "interview",
            "selected",
            "rejected"
        ]

        if status not in allowed_statuses:
            return {
                "error": "Invalid application status",
                "allowed_statuses": allowed_statuses
            }, 400

        result = extensions.db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"status": status}}
        )

        if result.matched_count == 0:
            return {"error": "Application not found"}, 404

        return {
            "message": "Application status updated successfully",
            "status": status
        }, 200

    except Exception as e:
        print(f"Update application status error: {e}")
        return {"error": "Unable to update application status"}, 500


# =========================
# DELETE STUDENT
# =========================
@admin_bp.route("/students/<student_id>", methods=["DELETE"])
@jwt_required()
def delete_student(student_id):
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        if not ObjectId.is_valid(student_id):
            return {"error": "Invalid student ID"}, 400

        student_object_id = ObjectId(student_id)

        user_result = extensions.db.users.delete_one({
            "_id": student_object_id,
            "role": "student"
        })

        extensions.db.students.delete_one({
            "user_id": student_object_id
        })

        if user_result.deleted_count == 0:
            return {"error": "Student not found"}, 404

        return {"message": "Student deleted successfully"}, 200

    except Exception as e:
        print(f"Delete student error: {e}")
        return {"error": "Unable to delete student"}, 500


# =========================
# VERIFY STUDENT
# =========================
@admin_bp.route("/students/<student_id>/verify", methods=["PUT"])
@jwt_required()
def toggle_verify_student(student_id):
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        if not ObjectId.is_valid(student_id):
            return {"error": "Invalid student ID"}, 400

        data = request.get_json() or {}
        verified = bool(data.get("verified", True))

        result = extensions.db.students.update_one(
            {"user_id": ObjectId(student_id)},
            {"$set": {"verified": verified}}
        )

        if result.matched_count == 0:
            return {"error": "Student profile not found"}, 404

        return {
            "message": "Student verification updated successfully",
            "verified": verified
        }, 200

    except Exception as e:
        print(f"Verify student error: {e}")
        return {"error": "Unable to update student verification"}, 500


# =========================
# UPDATE STUDENT PLACEMENT STATUS
# =========================
@admin_bp.route("/students/<student_id>/status", methods=["PUT"])
@jwt_required()
def update_student_placement_status(student_id):
    try:
        user, error_response, status_code = check_admin()

        if error_response:
            return error_response, status_code

        if not ObjectId.is_valid(student_id):
            return {"error": "Invalid student ID"}, 400

        data = request.get_json() or {}
        status = (
            data.get("placementStatus")
            or data.get("status")
            or "Not Placed"
        )

        allowed_statuses = ["Not Placed", "Shortlisted", "Placed"]

        if status not in allowed_statuses:
            return {
                "error": "Invalid placement status",
                "allowed_statuses": allowed_statuses
            }, 400

        result = extensions.db.students.update_one(
            {"user_id": ObjectId(student_id)},
            {"$set": {"placement_status": status}}
        )

        if result.matched_count == 0:
            return {"error": "Student profile not found"}, 404

        return {
            "message": "Student status updated successfully",
            "placementStatus": status
        }, 200

    except Exception as e:
        print(f"Update placement status error: {e}")
        return {"error": "Unable to update placement status"}, 500
