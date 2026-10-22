from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from app import extensions


def create_user(user_data):

    email = user_data["email"].lower()

    # Check if email already exists
    existing_user = extensions.db.users.find_one({"email": email})

    if existing_user:
        return None

    user = {
        "name": user_data["name"],
        "email": email,
        "password": generate_password_hash(user_data["password"]),
        "role": user_data.get("role", "student"),
        "created_at": datetime.utcnow()
    }

    result = extensions.db.users.insert_one(user)
    inserted_id = result.inserted_id
    # For MySQL, inserted_id is an integer; convert to int if it's a string
    try:
        inserted_id = int(inserted_id)
    except (ValueError, TypeError):
        pass

    # If role is student, automatically create corresponding row in students table
    if user["role"] == "student":
        try:
            extensions.db.students.insert_one({
                "user_id": inserted_id,
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
            print(f"[WARNING] Failed to create student profile for {email}: {e}")

    return result


def authenticate_user(email, password):

    email = email.lower()

    # Find user by email
    user = extensions.db.users.find_one({"email": email})

    # User not found
    if not user:
        return None

    # Check password
    if not check_password_hash(user["password"], password):
        return None

    # Login credentials are correct
    return user