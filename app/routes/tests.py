from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.models.test import create_test, create_test_result
from app import extensions


tests_bp = Blueprint("tests", __name__)


# =========================
# ADMIN CHECK
# =========================
def check_admin():
    user_id = get_jwt_identity()

    if not ObjectId.is_valid(user_id):
        return False

    user = extensions.db.users.find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        return False

    return user.get("role") == "admin"


# =========================
# CREATE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/", methods=["POST"])
@jwt_required()
def add_test():
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        title = data.get("title", "").strip()

        if not title:
            return {
                "error": "Test title is required"
            }, 400

        questions = data.get("questions", [])

        if not isinstance(questions, list) or len(questions) == 0:
            return {
                "error": "At least one question is required"
            }, 400

        test_data = {
            "title": title,
            "description": data.get("description", ""),
            "duration": data.get("duration", 30),
            "questions": questions
        }

        result = create_test(test_data)

        return {
            "message": "Mock test created successfully",
            "test_id": str(result.inserted_id)
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET ALL MOCK TESTS
# STUDENT + ADMIN
# =========================
@tests_bp.route("/", methods=["GET"])
@jwt_required()
def get_tests():
    try:
        tests = list(
            extensions.db.tests.find().sort(
                "created_at",
                -1
            )
        )

        for test in tests:
            test["_id"] = str(test["_id"])

            # Hide correct answers
            for question in test.get("questions", []):
                question.pop("answer", None)

        return {
            "message": "Mock tests fetched successfully",
            "tests": tests
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET MY TEST RESULTS
# MUST COME BEFORE /<test_id>
# =========================
@tests_bp.route("/results/my", methods=["GET"])
@jwt_required()
def get_my_results():
    try:
        user_id = get_jwt_identity()

        results = list(
            extensions.db.test_results.find({
                "user_id": user_id
            }).sort(
                "submitted_at",
                -1
            )
        )

        for result in results:
            result["_id"] = str(result["_id"])

        return {
            "message": "Test results fetched successfully",
            "results": results
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET SINGLE MOCK TEST
# STUDENT + ADMIN
# =========================
@tests_bp.route("/<test_id>", methods=["GET"])
@jwt_required()
def get_test(test_id):
    try:
        if not ObjectId.is_valid(test_id):
            return {
                "error": "Invalid test ID"
            }, 400

        test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not test:
            return {
                "error": "Test not found"
            }, 404

        test["_id"] = str(test["_id"])

        # Hide correct answers
        for question in test.get("questions", []):
            question.pop("answer", None)

        return {
            "message": "Mock test fetched successfully",
            "test": test
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# UPDATE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/<test_id>", methods=["PUT"])
@jwt_required()
def update_test(test_id):
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        if not ObjectId.is_valid(test_id):
            return {
                "error": "Invalid test ID"
            }, 400

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        existing_test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not existing_test:
            return {
                "error": "Test not found"
            }, 404

        title = data.get(
            "title",
            existing_test.get("title", "")
        )

        description = data.get(
            "description",
            existing_test.get("description", "")
        )

        duration = data.get(
            "duration",
            existing_test.get("duration", 30)
        )

        questions = data.get(
            "questions",
            existing_test.get("questions", [])
        )

        if not str(title).strip():
            return {
                "error": "Test title is required"
            }, 400

        if not isinstance(questions, list) or len(questions) == 0:
            return {
                "error": "At least one question is required"
            }, 400

        extensions.db.tests.update_one(
            {
                "_id": ObjectId(test_id)
            },
            {
                "$set": {
                    "title": title,
                    "description": description,
                    "duration": duration,
                    "questions": questions
                }
            }
        )

        return {
            "message": "Mock test updated successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# DELETE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/<test_id>", methods=["DELETE"])
@jwt_required()
def delete_test(test_id):
    try:
        if not check_admin():
            return {
                "error": "Admin access required"
            }, 403

        if not ObjectId.is_valid(test_id):
            return {
                "error": "Invalid test ID"
            }, 400

        result = extensions.db.tests.delete_one({
            "_id": ObjectId(test_id)
        })

        if result.deleted_count == 0:
            return {
                "error": "Test not found"
            }, 404

        return {
            "message": "Mock test deleted successfully"
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# SUBMIT MOCK TEST
# STUDENT + ADMIN
# =========================
@tests_bp.route("/<test_id>/submit", methods=["POST"])
@jwt_required()
def submit_test(test_id):
    try:
        if not ObjectId.is_valid(test_id):
            return {
                "error": "Invalid test ID"
            }, 400

        data = request.get_json()

        if not data:
            return {
                "error": "Request body is required"
            }, 400

        answers = data.get("answers", [])

        if not isinstance(answers, list):
            return {
                "error": "Answers must be a list"
            }, 400

        test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not test:
            return {
                "error": "Test not found"
            }, 404

        questions = test.get("questions", [])

        if len(answers) != len(questions):
            return {
                "error": "Number of answers must match number of questions"
            }, 400

        score = 0

        for index, question in enumerate(questions):
            correct_answer = question.get("answer")
            student_answer = answers[index]

            if (
                isinstance(student_answer, str)
                and isinstance(correct_answer, str)
                and student_answer.strip().lower()
                == correct_answer.strip().lower()
            ):
                score += 1

        user_id = get_jwt_identity()

        result = create_test_result({
            "user_id": user_id,
            "test_id": test_id,
            "answers": answers,
            "score": score,
            "total_questions": len(questions)
        })

        return {
            "message": "Test submitted successfully",
            "result_id": str(result.inserted_id),
            "score": score,
            "total_questions": len(questions)
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500