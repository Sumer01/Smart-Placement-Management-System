from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from docx import Document
from bson import ObjectId

from app.models.resume import create_resume_analysis
from app import extensions


resume_bp = Blueprint("resume", __name__)


# =========================
# ALLOWED FILE TYPES
# =========================
ALLOWED_EXTENSIONS = {
    "pdf",
    "docx",
    "txt"
}


# =========================
# CHECK FILE EXTENSION
# =========================
def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =========================
# EXTRACT PDF TEXT
# =========================
def extract_pdf_text(file):
    reader = PdfReader(file)

    text = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text.append(page_text)

    return "\n".join(text)


# =========================
# EXTRACT DOCX TEXT
# =========================
def extract_docx_text(file):
    document = Document(file)

    paragraphs = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text)

    return "\n".join(paragraphs)


# =========================
# ANALYZE RESUME
# =========================
@resume_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_resume():
    try:
        user_id = get_jwt_identity()

        resume_text = ""
        filename = ""

        # =================================
        # FILE UPLOAD
        # =================================
        file = request.files.get("file")

        if file:
            if not file.filename:
                return {
                    "error": "Resume file is required"
                }, 400

            filename = secure_filename(file.filename)

            if not allowed_file(filename):
                return {
                    "error": "Only PDF, DOCX and TXT files are allowed"
                }, 400

            extension = filename.rsplit(".", 1)[1].lower()

            if extension == "pdf":
                resume_text = extract_pdf_text(file)

            elif extension == "docx":
                resume_text = extract_docx_text(file)

            elif extension == "txt":
                resume_text = file.read().decode(
                    "utf-8",
                    errors="ignore"
                )

        # =================================
        # JSON TEXT INPUT
        # =================================
        else:
            data = request.get_json(silent=True)

            if not data:
                return {
                    "error": "Resume file or resume_text is required",
                    "content_type": request.content_type
                }, 400

            resume_text = data.get(
                "resume_text",
                ""
            ).strip()

            filename = data.get(
                "filename",
                "resume.txt"
            ).strip()

        # =================================
        # VALIDATE EXTRACTED TEXT
        # =================================
        if not resume_text.strip():
            return {
                "error": "Could not extract text from resume"
            }, 400

        # =================================
        # SKILL LIST
        # =================================
        skill_list = [
            "java",
            "python",
            "flask",
            "django",
            "fastapi",
            "react",
            "javascript",
            "html",
            "css",
            "mongodb",
            "mysql",
            "sql",
            "git",
            "rest api",
            "jwt",
            "machine learning",
            "deep learning",
            "nlp",
            "llm",
            "rag",
            "langchain"
        ]

        text_lower = resume_text.lower()

        # =================================
        # FIND SKILLS
        # =================================
        found_skills = []

        for skill in skill_list:
            if skill in text_lower:
                found_skills.append(skill)

        # =================================
        # BASIC SCORE
        # =================================
        score = min(
            len(found_skills) * 5,
            100
        )

        # =================================
        # SUGGESTIONS
        # =================================
        suggestions = []

        if "java" not in text_lower:
            suggestions.append(
                "Consider adding Java projects or experience."
            )

        if "python" not in text_lower:
            suggestions.append(
                "Consider adding Python experience."
            )

        if "sql" not in text_lower and "mysql" not in text_lower:
            suggestions.append(
                "Consider adding SQL or database experience."
            )

        if "git" not in text_lower:
            suggestions.append(
                "Consider adding Git/version control experience."
            )

        if "api" not in text_lower:
            suggestions.append(
                "Consider adding REST API experience."
            )

        if not suggestions:
            suggestions.append(
                "Resume contains the main technical keywords."
            )

        # =================================
        # SAVE ANALYSIS
        # =================================
        result = create_resume_analysis({
            "user_id": user_id,
            "filename": filename,
            "skills": found_skills,
            "score": score,
            "suggestions": suggestions
        })

        return {
            "message": "Resume analyzed successfully",
            "analysis_id": str(result.inserted_id),
            "filename": filename,
            "score": score,
            "skills": found_skills,
            "suggestions": suggestions
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET MY RESUME ANALYSES
# KEEP BEFORE /<analysis_id>
# =========================
@resume_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_resume_analyses():
    try:
        user_id = get_jwt_identity()

        analyses = list(
            extensions.db.resume_analyses.find({
                "user_id": user_id
            }).sort(
                "analyzed_at",
                -1
            )
        )

        for analysis in analyses:
            analysis["_id"] = str(
                analysis["_id"]
            )

        return {
            "message": "Resume analyses fetched successfully",
            "analyses": analyses
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# GET SINGLE RESUME ANALYSIS
# =========================
@resume_bp.route("/<analysis_id>", methods=["GET"])
@jwt_required()
def get_resume_analysis(analysis_id):
    try:
        if not ObjectId.is_valid(analysis_id):
            return {
                "error": "Invalid analysis ID"
            }, 400

        user_id = get_jwt_identity()

        analysis = extensions.db.resume_analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": user_id
        })

        if not analysis:
            return {
                "error": "Resume analysis not found"
            }, 404

        analysis["_id"] = str(
            analysis["_id"]
        )

        return {
            "message": "Resume analysis fetched successfully",
            "analysis": analysis
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500