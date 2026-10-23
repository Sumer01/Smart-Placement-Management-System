from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app import extensions


admin_bp = Blueprint("admin", __name__)


# =========================
# GET CURRENT USER
# =========================
def get_current_user():
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        if ObjectId.is_valid(user_id):
            user = extensions.db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                return user
    except Exception:
        pass
    return extensions.db.users.find_one({"id": user_id}) or extensions.db.users.find_one({"_id": str(user_id)})


# =========================
# CHECK ADMIN
# =========================
def check_admin():
    user = get_current_user()

    if not user:
        return None, {
            "error": "User not found"
        }, 404

    if user.get("role") != "admin":
        return None, {
            "error": "Admin access required"
        }, 403

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

        total_students = extensions.db.users.count_documents({
            "role": "student"
        })

        total_jobs = extensions.db.jobs.count_documents({})

        total_applications = extensions.db.applications.count_documents({})

        total_tests = extensions.db.tests.count_documents({})

        return {
            "message": "Admin dashboard fetched successfully",
            "statistics": {
                "total_students": total_students,
                "total_jobs": total_jobs,
                "total_applications": total_applications,
                "total_tests": total_tests
            }
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


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

        students_profiles = list(extensions.db.students.find({}))
        profile_map = {str(p.get("user_id")): p for p in students_profiles}

        enriched_students = []
        for u in users:
            uid = str(u.get("id") or u.get("_id"))
            p = profile_map.get(uid) or {}
            enriched_students.append({
                "id": uid,
                "_id": uid,
                "user_id": uid,
                "name": u.get("name") or p.get("name", "Student"),
                "email": u.get("email") or p.get("email", ""),
                "rollNo": p.get("roll_no") or "Not Assigned",
                "degree": p.get("degree") or p.get("course") or "MCA",
                "department": p.get("department") or "Computer Applications",
                "college": p.get("college") or "CUSAT",
                "cgpa": str(p.get("cgpa")) if p.get("cgpa") is not None else "8.5",
                "backlogs": p.get("backlogs") or 0,
                "phone": p.get("phone") or "Not Provided",
                "gender": p.get("gender") or "",
                "location": p.get("location") or "Not Provided",
                "placementStatus": p.get("placement_status") or "Not Placed",
                "verified": bool(p.get("verified", False)),
                "isRegistered": bool(p.get("is_registered", True)),
                "skills": p.get("skills") or []
            })

        return {
            "message": "Students fetched successfully",
            "students": enriched_students
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


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
            extensions.db.applications.find().sort(
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
            return {
                "error": "Invalid application ID"
            }, 400

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        status = data.get("status", "").strip().lower()

        allowed_statuses = [
            "applied",
            "shortlisted",
            "rejected",
            "selected"
        ]

        if status not in allowed_statuses:
            return {
                "error": "Invalid application status",
                "allowed_statuses": allowed_statuses
            }, 400

        application = extensions.db.applications.find_one({
            "_id": ObjectId(application_id)
        })

        if not application:
            return {
                "error": "Application not found"
            }, 404

        extensions.db.applications.update_one(
            {
                "_id": ObjectId(application_id)
            },
            {
                "$set": {
                    "status": status
                }
            }
        )

        return {
            "message": "Application status updated successfully",
            "status": status
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


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

        # Remove student user account
        extensions.db.users.delete_one({"_id": student_id, "role": "student"})
        extensions.db.users.delete_one({"id": student_id, "role": "student"})
        extensions.db.students.delete_one({"user_id": str(student_id)})
        extensions.db.students.delete_one({"id": student_id})

        return {
            "message": "Student deleted successfully from MySQL database"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# UPDATE / VERIFY STUDENT
# =========================
@admin_bp.route("/students/<student_id>/verify", methods=["PUT"])
@jwt_required()
def toggle_verify_student(student_id):
    try:
        user, error_response, status_code = check_admin()
        if error_response:
            return error_response, status_code

        data = request.get_json() or {}
        verified = bool(data.get("verified", True))

        extensions.db.students.update_one(
            {"user_id": str(student_id)},
            {"$set": {"verified": verified}}
        )

        return {
            "message": "Student verification updated successfully",
            "verified": verified
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


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

        data = request.get_json() or {}
        status = data.get("placementStatus") or data.get("status") or "Not Placed"

        extensions.db.students.update_one(
            {"user_id": str(student_id)},
            {"$set": {"placement_status": status}}
        )

        return {
            "message": "Student status updated successfully",
            "placementStatus": status
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500