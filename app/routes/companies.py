from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app import extensions

companies_bp = Blueprint("companies", __name__)


def is_admin():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return False
        user = extensions.db.users.find_one({"id": user_id}) or extensions.db.users.find_one({"_id": str(user_id)})
        return bool(user and user.get("role") == "admin")
    except Exception:
        return False


def serialize_company(c):
    cid = str(c.get("id") or c.get("_id"))
    return {
        "id": cid,
        "_id": cid,
        "name": c.get("company_name") or c.get("name") or "",
        "company_name": c.get("company_name") or c.get("name") or "",
        "industry": c.get("industry") or "Information Technology",
        "location": c.get("location") or "India",
        "status": c.get("status") or "Active",
        "rolesCount": int(c.get("roles_count") or 1),
        "logoLetter": c.get("logo_letter") or (c.get("company_name") or c.get("name") or "C")[0].upper(),
        "role": c.get("role") or "",
        "packageLpa": float(c.get("package_lpa") or 0.0),
        "minCgpa": float(c.get("min_cgpa") or 6.0),
        "maxBacklogs": int(c.get("max_backlogs") or 0),
        "driveDate": c.get("drive_date") or "",
        "deadline": c.get("deadline") or "",
        "aboutCompany": c.get("about_company") or c.get("description") or "",
        "jobDescription": c.get("job_description") or "",
        "requiredSkills": c.get("required_skills") or "",
        "selectionProcess": c.get("selection_process") or "",
        "isInDrives": bool(c.get("is_in_drives", False))
    }


# =========================
# GET ALL COMPANIES
# =========================
@companies_bp.route("", methods=["GET"])
def get_companies():
    try:
        companies_list = list(extensions.db.companies.find({}))
        serialized = [serialize_company(c) for c in companies_list]
        return {
            "message": "Companies fetched successfully",
            "companies": serialized
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


# =========================
# GET SINGLE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["GET"])
def get_single_company(company_id):
    try:
        c = extensions.db.companies.find_one({"id": company_id}) or extensions.db.companies.find_one({"_id": str(company_id)})
        if not c:
            return {"error": "Company not found"}, 404
        return {
            "message": "Company fetched successfully",
            "company": serialize_company(c)
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


# =========================
# ADD COMPANY
# =========================
@companies_bp.route("", methods=["POST"])
@jwt_required()
def add_company():
    try:
        if not is_admin():
            return {"error": "Admin access required"}, 403

        data = request.get_json() or {}
        name = (data.get("name") or data.get("company_name") or "").strip()
        if not name:
            return {"error": "Company name is required"}, 400

        # Check existing
        existing = extensions.db.companies.find_one({"company_name": name})
        if existing:
            return {"error": "Company already exists"}, 409

        logo = data.get("logoLetter") or name[0].upper()

        new_doc = {
            "company_name": name,
            "industry": data.get("industry") or "Information Technology",
            "location": data.get("location") or "India",
            "status": data.get("status") or "Active",
            "roles_count": int(data.get("rolesCount") or 1),
            "logo_letter": logo,
            "role": data.get("role") or "",
            "package_lpa": str(data.get("packageLpa") or "0"),
            "min_cgpa": str(data.get("minCgpa") or "6.0"),
            "max_backlogs": str(data.get("maxBacklogs") or "0"),
            "drive_date": data.get("driveDate") or "",
            "deadline": data.get("deadline") or "",
            "about_company": data.get("aboutCompany") or data.get("description") or "",
            "job_description": data.get("jobDescription") or "",
            "required_skills": data.get("requiredSkills") or "",
            "selection_process": data.get("selectionProcess") or "",
            "is_in_drives": bool(data.get("isInDrives", False))
        }

        res = extensions.db.companies.insert_one(new_doc)
        inserted_id = str(res.inserted_id)
        new_doc["id"] = inserted_id

        return {
            "message": "Company added successfully to MySQL",
            "company": serialize_company(new_doc)
        }, 201
    except Exception as e:
        return {"error": str(e)}, 500


# =========================
# UPDATE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["PUT"])
@jwt_required()
def update_company(company_id):
    try:
        if not is_admin():
            return {"error": "Admin access required"}, 403

        data = request.get_json() or {}
        update_fields = {}

        if "name" in data or "company_name" in data:
            update_fields["company_name"] = (data.get("name") or data.get("company_name")).strip()
        if "industry" in data:
            update_fields["industry"] = data["industry"]
        if "location" in data:
            update_fields["location"] = data["location"]
        if "status" in data:
            update_fields["status"] = data["status"]
        if "rolesCount" in data or "roles_count" in data:
            update_fields["roles_count"] = int(data.get("rolesCount") or data.get("roles_count") or 1)
        if "logoLetter" in data or "logo_letter" in data:
            update_fields["logo_letter"] = data.get("logoLetter") or data.get("logo_letter")
        if "role" in data:
            update_fields["role"] = data["role"]
        if "packageLpa" in data or "package_lpa" in data:
            update_fields["package_lpa"] = str(data.get("packageLpa") or data.get("package_lpa"))
        if "minCgpa" in data or "min_cgpa" in data:
            update_fields["min_cgpa"] = str(data.get("minCgpa") or data.get("min_cgpa"))
        if "maxBacklogs" in data or "max_backlogs" in data:
            update_fields["max_backlogs"] = str(data.get("maxBacklogs") or data.get("max_backlogs"))
        if "driveDate" in data or "drive_date" in data:
            update_fields["drive_date"] = data.get("driveDate") or data.get("drive_date")
        if "deadline" in data:
            update_fields["deadline"] = data["deadline"]
        if "aboutCompany" in data or "about_company" in data:
            update_fields["about_company"] = data.get("aboutCompany") or data.get("about_company")
        if "jobDescription" in data or "job_description" in data:
            update_fields["job_description"] = data.get("jobDescription") or data.get("job_description")
        if "requiredSkills" in data or "required_skills" in data:
            update_fields["required_skills"] = data.get("requiredSkills") or data.get("required_skills")
        if "selectionProcess" in data or "selection_process" in data:
            update_fields["selection_process"] = data.get("selectionProcess") or data.get("selection_process")
        if "isInDrives" in data or "is_in_drives" in data:
            update_fields["is_in_drives"] = bool(data.get("isInDrives") if "isInDrives" in data else data.get("is_in_drives"))

        extensions.db.companies.update_one(
            {"id": company_id},
            {"$set": update_fields}
        )

        updated = extensions.db.companies.find_one({"id": company_id}) or extensions.db.companies.find_one({"_id": str(company_id)})
        return {
            "message": "Company updated successfully in MySQL",
            "company": serialize_company(updated) if updated else update_fields
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500


# =========================
# DELETE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["DELETE"])
@jwt_required()
def delete_company(company_id):
    try:
        if not is_admin():
            return {"error": "Admin access required"}, 403

        extensions.db.companies.delete_one({"id": company_id})
        extensions.db.companies.delete_one({"_id": str(company_id)})

        return {
            "message": "Company deleted successfully from MySQL"
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
