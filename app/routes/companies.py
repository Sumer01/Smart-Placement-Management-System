
from bson import ObjectId
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import extensions

companies_bp = Blueprint("companies", __name__)


def is_admin():
    try:
        user_id = get_jwt_identity()

        if not user_id or not ObjectId.is_valid(user_id):
            return False

        user = extensions.db.users.find_one({
            "_id": ObjectId(user_id)
        })

        return bool(user and user.get("role") == "admin")
    except Exception:
        return False


def serialize_company(company):
    company_id = str(company.get("_id", ""))

    return {
        "id": company_id,
        "_id": company_id,
        "name": company.get("company_name") or company.get("name") or "",
        "company_name": company.get("company_name") or company.get("name") or "",
        "industry": company.get("industry") or "Information Technology",
        "location": company.get("location") or "India",
        "status": company.get("status") or "Active",
        "rolesCount": int(company.get("roles_count") or 1),
        "logoLetter": company.get("logo_letter") or (
            company.get("company_name") or company.get("name") or "C"
        )[0].upper(),
        "role": company.get("role") or "",
        "packageLpa": float(company.get("package_lpa") or 0),
        "minCgpa": float(company.get("min_cgpa") or 6),
        "maxBacklogs": int(company.get("max_backlogs") or 0),
        "driveDate": company.get("drive_date") or "",
        "deadline": company.get("deadline") or "",
        "aboutCompany": company.get("about_company") or company.get("description") or "",
        "jobDescription": company.get("job_description") or "",
        "requiredSkills": company.get("required_skills") or "",
        "selectionProcess": company.get("selection_process") or "",
        "isInDrives": bool(company.get("is_in_drives", False))
    }


# =========================
# GET ALL COMPANIES
# =========================
@companies_bp.route("", methods=["GET"])
def get_companies():
    try:
        companies = list(extensions.db.companies.find({}))

        return {
            "message": "Companies fetched successfully",
            "companies": [serialize_company(c) for c in companies]
        }, 200

    except Exception as e:
        print(f"Get companies error: {e}")
        return {"error": "Unable to fetch companies"}, 500


# =========================
# GET SINGLE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["GET"])
def get_single_company(company_id):
    try:
        if not ObjectId.is_valid(company_id):
            return {"error": "Invalid company ID"}, 400

        company = extensions.db.companies.find_one({
            "_id": ObjectId(company_id)
        })

        if not company:
            return {"error": "Company not found"}, 404

        return {
            "message": "Company fetched successfully",
            "company": serialize_company(company)
        }, 200

    except Exception as e:
        print(f"Get company error: {e}")
        return {"error": "Unable to fetch company"}, 500


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

        existing = extensions.db.companies.find_one({
            "company_name": name
        })

        if existing:
            return {"error": "Company already exists"}, 409

        new_company = {
            "company_name": name,
            "industry": data.get("industry") or "Information Technology",
            "location": data.get("location") or "India",
            "status": data.get("status") or "Active",
            "roles_count": int(data.get("rolesCount") or 1),
            "logo_letter": data.get("logoLetter") or name[0].upper(),
            "role": data.get("role") or "",
            "package_lpa": float(data.get("packageLpa") or 0),
            "min_cgpa": float(data.get("minCgpa") or 6),
            "max_backlogs": int(data.get("maxBacklogs") or 0),
            "drive_date": data.get("driveDate") or "",
            "deadline": data.get("deadline") or "",
            "about_company": data.get("aboutCompany") or data.get("description") or "",
            "job_description": data.get("jobDescription") or "",
            "required_skills": data.get("requiredSkills") or "",
            "selection_process": data.get("selectionProcess") or "",
            "is_in_drives": bool(data.get("isInDrives", False))
        }

        result = extensions.db.companies.insert_one(new_company)
        new_company["_id"] = result.inserted_id

        return {
            "message": "Company added successfully",
            "company": serialize_company(new_company)
        }, 201

    except (ValueError, TypeError):
        return {"error": "Invalid numeric company details"}, 400
    except Exception as e:
        print(f"Add company error: {e}")
        return {"error": "Unable to add company"}, 500


# =========================
# UPDATE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["PUT"])
@jwt_required()
def update_company(company_id):
    try:
        if not is_admin():
            return {"error": "Admin access required"}, 403

        if not ObjectId.is_valid(company_id):
            return {"error": "Invalid company ID"}, 400

        data = request.get_json() or {}
        company_object_id = ObjectId(company_id)

        existing = extensions.db.companies.find_one({
            "_id": company_object_id
        })

        if not existing:
            return {"error": "Company not found"}, 404

        update_fields = {}

        field_map = {
            "industry": ("industry",),
            "location": ("location",),
            "status": ("status",),
            "role": ("role",),
            "deadline": ("deadline",),
            "aboutCompany": ("about_company", "aboutCompany"),
            "jobDescription": ("job_description", "jobDescription"),
            "requiredSkills": ("required_skills", "requiredSkills"),
            "selectionProcess": ("selection_process", "selectionProcess"),
            "driveDate": ("drive_date", "driveDate")
        }

        if "name" in data or "company_name" in data:
            update_fields["company_name"] = (
                data.get("name") or data.get("company_name") or ""
            ).strip()

        for incoming_key, (database_key, *alternates) in field_map.items():
            for key in (incoming_key, *alternates):
                if key in data:
                    update_fields[database_key] = data[key]
                    break

        numeric_fields = {
            "roles_count": ("rolesCount", "roles_count", int),
            "package_lpa": ("packageLpa", "package_lpa", float),
            "min_cgpa": ("minCgpa", "min_cgpa", float),
            "max_backlogs": ("maxBacklogs", "max_backlogs", int)
        }

        for db_key, (primary, alternate, converter) in numeric_fields.items():
            if primary in data or alternate in data:
                value = data.get(primary) if primary in data else data.get(alternate)
                update_fields[db_key] = converter(value) if value not in (None, "") else 0

        if "logoLetter" in data or "logo_letter" in data:
            update_fields["logo_letter"] = data.get("logoLetter") or data.get("logo_letter")

        if "isInDrives" in data or "is_in_drives" in data:
            update_fields["is_in_drives"] = bool(
                data.get("isInDrives")
                if "isInDrives" in data
                else data.get("is_in_drives")
            )

        if update_fields:
            extensions.db.companies.update_one(
                {"_id": company_object_id},
                {"$set": update_fields}
            )

        updated = extensions.db.companies.find_one({
            "_id": company_object_id
        })

        return {
            "message": "Company updated successfully",
            "company": serialize_company(updated)
        }, 200

    except (ValueError, TypeError):
        return {"error": "Invalid numeric company details"}, 400
    except Exception as e:
        print(f"Update company error: {e}")
        return {"error": "Unable to update company"}, 500


# =========================
# DELETE COMPANY
# =========================
@companies_bp.route("/<company_id>", methods=["DELETE"])
@jwt_required()
def delete_company(company_id):
    try:
        if not is_admin():
            return {"error": "Admin access required"}, 403

        if not ObjectId.is_valid(company_id):
            return {"error": "Invalid company ID"}, 400

        result = extensions.db.companies.delete_one({
            "_id": ObjectId(company_id)
        })

        if result.deleted_count == 0:
            return {"error": "Company not found"}, 404

        return {"message": "Company deleted successfully"}, 200

    except Exception as e:
        print(f"Delete company error: {e}")
        return {"error": "Unable to delete company"}, 500
