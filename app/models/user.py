
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import extensions


def create_user(user_data):
    email = user_data["email"].strip().lower()
    role = user_data.get("role", "student").strip().lower()

    existing_user = extensions.db.users.find_one({"email": email})
    if existing_user:
        return None

    user = {
        "name": user_data["name"].strip(),
        "email": email,
        "password": generate_password_hash(user_data["password"]),
        "role": role,
        "created_at": datetime.utcnow()
    }

    result = extensions.db.users.insert_one(user)
    user_id = result.inserted_id

    if role == "student":
        extensions.db.students.insert_one({
            "user_id": user_id,
            "name": user["name"],
            "roll_no": None,
            "phone": "",
            "gender": "",
            "location": "",
            "degree": "MCA",
            "course": "MCA",
            "department": "Computer Applications",
            "college": "CUSAT",
            "semester": "",
            "cgpa": 0.0,
            "backlogs": 0,
            "skills": [],
            "resume_name": "",
            "resume_url": "",
            "placement_status": "Not Placed",
            "verified": 1,
            "is_registered": 1
        })

    return result


def authenticate_user(email, password):
    email = email.strip().lower()
    user = extensions.db.users.find_one({"email": email})

    if not user:
        return None

    if not check_password_hash(user["password"], password):
        return None

    return user
