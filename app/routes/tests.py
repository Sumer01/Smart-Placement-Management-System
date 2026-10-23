
from bson import ObjectId
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.test import create_test, create_test_result
from app import extensions

tests_bp = Blueprint("tests", __name__)


# =========================
# ADMIN CHECK
# =========================
def check_admin():
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


# =========================
# CREATE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/", methods=["POST"])
@jwt_required()
def add_test():
    try:
        if not check_admin():
            return {"error": "Admin access required"}, 403

        data = request.get_json(silent=True) or {}

        title = data.get("title", "").strip()
        questions = data.get("questions", [])

        if not title:
            return {"error": "Test title is required"}, 400

        if not isinstance(questions, list) or not questions:
            return {"error": "At least one question is required"}, 400

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

    except Exception:
        return {"error": "Unable to create mock test"}, 500


# =========================
# GET ALL MOCK TESTS
# STUDENT + ADMIN
# =========================
@tests_bp.route("/", methods=["GET"])
@jwt_required()
def get_tests():
    try:
        tests = list(
            extensions.db.tests.find().sort("created_at", -1)
        )

        for test in tests:
            test["_id"] = str(test["_id"])

            # Do not expose correct answers to students.
            for question in test.get("questions", []):
                question.pop("answer", None)

        return {
            "message": "Mock tests fetched successfully",
            "tests": tests
        }, 200

    except Exception:
        return {"error": "Unable to fetch mock tests"}, 500


# =========================
# GET MY TEST RESULTS
# =========================
@tests_bp.route("/results/my", methods=["GET"])
@jwt_required()
def get_my_results():
    try:
        user_id = get_jwt_identity()

        if not user_id or not ObjectId.is_valid(user_id):
            return {"error": "Invalid user ID"}, 400

        results = list(
            extensions.db.test_results.find({
                "user_id": ObjectId(user_id)
            }).sort("submitted_at", -1)
        )

        for result in results:
            result["_id"] = str(result["_id"])

            if isinstance(result.get("user_id"), ObjectId):
                result["user_id"] = str(result["user_id"])

            if isinstance(result.get("test_id"), ObjectId):
                result["test_id"] = str(result["test_id"])

        return {
            "message": "Test results fetched successfully",
            "results": results
        }, 200

    except Exception:
        return {"error": "Unable to fetch test results"}, 500


# =========================
# GET SINGLE MOCK TEST
# =========================
@tests_bp.route("/<test_id>", methods=["GET"])
@jwt_required()
def get_test(test_id):
    try:
        if not ObjectId.is_valid(test_id):
            return {"error": "Invalid test ID"}, 400

        test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not test:
            return {"error": "Test not found"}, 404

        test["_id"] = str(test["_id"])

        for question in test.get("questions", []):
            question.pop("answer", None)

        return {
            "message": "Mock test fetched successfully",
            "test": test
        }, 200

    except Exception:
        return {"error": "Unable to fetch mock test"}, 500


# =========================
# UPDATE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/<test_id>", methods=["PUT"])
@jwt_required()
def update_test(test_id):
    try:
        if not check_admin():
            return {"error": "Admin access required"}, 403

        if not ObjectId.is_valid(test_id):
            return {"error": "Invalid test ID"}, 400

        data = request.get_json(silent=True) or {}

        existing_test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not existing_test:
            return {"error": "Test not found"}, 404

        title = data.get("title", existing_test.get("title", ""))
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

        if not isinstance(title, str) or not title.strip():
            return {"error": "Test title is required"}, 400

        if not isinstance(questions, list) or not questions:
            return {"error": "At least one question is required"}, 400

        extensions.db.tests.update_one(
            {"_id": ObjectId(test_id)},
            {
                "$set": {
                    "title": title.strip(),
                    "description": description,
                    "duration": duration,
                    "questions": questions
                }
            }
        )

        return {"message": "Mock test updated successfully"}, 200

    except Exception:
        return {"error": "Unable to update mock test"}, 500


# =========================
# DELETE MOCK TEST
# ADMIN ONLY
# =========================
@tests_bp.route("/<test_id>", methods=["DELETE"])
@jwt_required()
def delete_test(test_id):
    try:
        if not check_admin():
            return {"error": "Admin access required"}, 403

        if not ObjectId.is_valid(test_id):
            return {"error": "Invalid test ID"}, 400

        result = extensions.db.tests.delete_one({
            "_id": ObjectId(test_id)
        })

        if result.deleted_count == 0:
            return {"error": "Test not found"}, 404

        return {"message": "Mock test deleted successfully"}, 200

    except Exception:
        return {"error": "Unable to delete mock test"}, 500


# =========================
# SUBMIT MOCK TEST
# STUDENT + ADMIN
# =========================
@tests_bp.route("/<test_id>/submit", methods=["POST"])
@jwt_required()
def submit_test(test_id):
    try:
        if not ObjectId.is_valid(test_id):
            return {"error": "Invalid test ID"}, 400

        data = request.get_json(silent=True) or {}
        answers = data.get("answers", [])

        if not isinstance(answers, list):
            return {"error": "Answers must be a list"}, 400

        test = extensions.db.tests.find_one({
            "_id": ObjectId(test_id)
        })

        if not test:
            return {"error": "Test not found"}, 404

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

        if not user_id or not ObjectId.is_valid(user_id):
            return {"error": "Invalid user ID"}, 400

        result = create_test_result({
            "user_id": ObjectId(user_id),
            "test_id": ObjectId(test_id),
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

    except Exception:
        return {"error": "Unable to submit mock test"}, 500
