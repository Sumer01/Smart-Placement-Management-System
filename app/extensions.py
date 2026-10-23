
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

mongo_client = None
db = None

jwt = JWTManager()


def init_db(config):
    global db, mongo_client

    mongo_uri = config.get("MONGO_URI")

    if not mongo_uri:
        raise RuntimeError("MONGO_URI is not configured.")

    try:
        mongo_client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=10000
        )

        mongo_client.admin.command("ping")
        db = mongo_client["smartplacement"]

        print("Connected to MongoDB Atlas successfully!")
        return db

    except Exception as e:
        raise RuntimeError(
            f"MongoDB Atlas connection failed: {e}"
        ) from e
