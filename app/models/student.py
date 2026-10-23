
from app import extensions


def create_student_profile(student_data):
    """Create a student profile in MongoDB Atlas."""

    student = {
        "user_id": student_data["user_id"],
        "name": student_data.get("name", ""),
        "roll_no": student_data.get("roll_no"),
        "phone": student_data.get("phone", ""),
        "gender": student_data.get("gender", ""),
        "location": student_data.get("location", ""),
        "degree": student_data.get(
            "degree",
            student_data.get("course", "MCA")
        ),
        "course": student_data.get("course", "MCA"),
        "department": student_data.get(
            "department",
            "Computer Applications"
        ),
        "college": student_data.get("college", "CUSAT"),
        "semester": student_data.get("semester", ""),
        "cgpa": student_data.get("cgpa"),
        "backlogs": student_data.get("backlogs", 0),
        "skills": student_data.get("skills", []),
        "resume_name": student_data.get("resume_name", ""),
        "resume_url": student_data.get("resume_url", ""),
        "placement_status": student_data.get(
            "placement_status",
            "Not Placed"
        ),
        "verified": student_data.get("verified", 1),
        "is_registered": student_data.get("is_registered", 1)
    }

    return extensions.db.students.insert_one(student)
