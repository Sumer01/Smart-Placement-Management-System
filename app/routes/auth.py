from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from app.models.user import create_user, authenticate_user

auth_bp = Blueprint("auth", __name__)


# =========================
# REGISTER
# =========================
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        # Check JSON data
        if not data:
            return {
                "error": "Request body is required"
            }, 400

        # Get values
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate name
        if not name:
            return {
                "error": "Name is required"
            }, 400

        # Validate email
        if not email:
            return {
                "error": "Email is required"
            }, 400

        # Validate password
        if not password:
            return {
                "error": "Password is required"
            }, 400

        # Password length
        if len(password) < 6:
            return {
                "error": "Password must be at least 6 characters"
            }, 400

        # Create user
        role = data.get("role", "student").strip().lower()
        result = create_user({
            "name": name,
            "email": email,
            "password": password,
            "role": role
        })

        # Duplicate email
        if result is None:
            return {
                "error": "Email already registered"
            }, 409

        return {
            "message": "User registered successfully"
        }, 201

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        # Check JSON data
        if not data:
            return {
                "error": "Request body is required"
            }, 400

        # Get login details
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate email
        if not email:
            return {
                "error": "Email is required"
            }, 400

        # Validate password
        if not password:
            return {
                "error": "Password is required"
            }, 400

        # Authenticate user
        user = authenticate_user(email, password)

        # Invalid credentials
        if not user:
            return {
                "error": "Invalid email or password"
            }, 401

        # Strict Role Validation
        requested_role = data.get("role", "").strip().lower()
        actual_role = str(user.get("role", "")).strip().lower()

        if requested_role and actual_role != requested_role:
            return {
                "error": f"Role mismatch: This account is registered as '{actual_role.capitalize()}', not '{requested_role.capitalize()}'. Please select '{actual_role.capitalize()}' in the 'Login As' dropdown."
            }, 403

        # Create JWT token
        access_token = create_access_token(
            identity=str(user["_id"])
        )

        return {
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500


# =========================
# CURRENT USER
# =========================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()

        return {
            "message": "User authenticated successfully",
            "user_id": user_id
        }, 200

    except Exception as e:
        return {
            "error": str(e)
        }, 500