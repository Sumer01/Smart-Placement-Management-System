from app import extensions


def create_student_profile(student_data):
    student = {
        "user_id": student_data["user_id"],
        "phone": student_data.get("phone", ""),
        "course": student_data.get("course", "MCA"),
        "college": student_data.get("college", ""),
        "semester": student_data.get("semester", ""),
        "cgpa": student_data.get("cgpa"),
        "skills": student_data.get("skills", []),
        "resume_url": student_data.get("resume_url", "")
    }

    return extensions.db.students.insert_one(student)