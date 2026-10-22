import os
from flask_jwt_extended import JWTManager

mongo_client = None
db = None

jwt = JWTManager()


def init_db(config):
    global db

    # 1. Attempt MySQL connection first
    try:
        from app.mysql_db import MySQLDatabase
        host = config.get("MYSQL_HOST", "localhost")
        port = config.get("MYSQL_PORT", 3306)
        user = config.get("MYSQL_USER", "root")
        password = config.get("MYSQL_PASSWORD", "")
        db_name = config.get("MYSQL_DB", "smart_placment_mangement_system")

        db = MySQLDatabase(host, port, user, password, db_name)
        print(f" Connected to MySQL Database ('{db_name}') successfully on {host}:{port}!")
        return db
    except Exception as e:
        print(f" Notice: Could not connect to MySQL server ({e}).")

    # 2. Attempt MongoDB fallback
    mongo_uri = config.get("MONGO_URI")
    if mongo_uri:
        try:
            from pymongo import MongoClient
            mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1500)
            mongo_client.admin.command("ping")
            db = mongo_client["smartplacement"]
            print(" Connected to MongoDB successfully!")
            return db
        except Exception:
            pass

    # 3. Local JSON database fallback
    print("⚡ Activating built-in Local Database engine (data/local_db.json)...")
    from app.local_db import LocalDatabase
    db = LocalDatabase()
    print(" Local Database initialized!")
    return db