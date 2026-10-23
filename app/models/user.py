
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import extensions


def create_user(user_data):
    email = user_data["email"].strip().lower()

    existing_user = extensions.db.users.find_one({"email": email})
    if existing_user:
        return None

    role = user_data.get("role", "student").strip().lower()

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
        try:
            extensions.db.students.insert_one({
                "user_id": user_id,
                "name": user["name"],
                "email": email,
                "degree": "MCA",
                "department": "Computer Applications",
                "college": "CUSAT",
                "cgpa": 8.50,
                "backlogs": 0,
                "placement_status": "Not Placed",
                "verified": 1,
                "is_registered": 1
            })
        except Exception as e:
            print(f"[WARNING] Student profile creation failed: {e}")

    return result


def authenticate_user(email, password):
    email = email.strip().lower()
    user = extensions.db.users.find_one({"email": email})

    if not user:
        return None

    if not check_password_hash(user["password"], password):
        return None

    return user
