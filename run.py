from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import jwt, init_db

from app.routes.auth import auth_bp
from app.routes.student import student_bp
from app.routes.jobs import jobs_bp
from app.routes.applications import applications_bp
from app.routes.tests import tests_bp
from app.routes.admin import admin_bp
from app.routes.resume import resume_bp
from app.routes.public import public_bp
from app.routes.companies import companies_bp


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Initialize JWT
    jwt.init_app(app)

    # Initialize Database (MySQL / MongoDB / Local DB)
    init_db(app.config)

    # =========================
    # REGISTER AUTH APIs
    # =========================
    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    # =========================
    # REGISTER COMPANIES APIs
    # =========================
    app.register_blueprint(
        companies_bp,
        url_prefix="/api/companies"
    )

    # =========================
    # REGISTER STUDENT APIs
    # =========================
    app.register_blueprint(
        student_bp,
        url_prefix="/api/students"
    )

    # =========================
    # REGISTER JOB APIs
    # =========================
    app.register_blueprint(
        jobs_bp,
        url_prefix="/api/jobs"
    )

    # =========================
    # REGISTER APPLICATION APIs
    # =========================
    app.register_blueprint(
        applications_bp,
        url_prefix="/api/applications"
    )

    # =========================
    # REGISTER MOCK TEST APIs
    # =========================
    app.register_blueprint(
        tests_bp,
        url_prefix="/api/tests"
    )

    # =========================
    # REGISTER ADMIN APIs
    # =========================
    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )

    # =========================
    # REGISTER RESUME APIs
    # =========================
    app.register_blueprint(
        resume_bp,
        url_prefix="/api/resume"
    )

    # =========================
    # REGISTER PUBLIC APIs
    # =========================
    app.register_blueprint(
        public_bp,
        url_prefix="/api/public"
    )

    # =========================
    # HOME / HEALTH CHECK
    # =========================
    @app.route("/")
    def home():
        return "Smart Placement Management System Backend is running!"

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        port=5001,
        debug=True,
        use_reloader=False
    )
