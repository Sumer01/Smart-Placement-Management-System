import os
import json
import pymysql
from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash


class MySQLCursor:
    def __init__(self, items):
        self.items = list(items)

    def sort(self, field, direction=-1):
        def sort_key(item):
            val = item.get(field)
            if val is None:
                return ""
            if isinstance(val, datetime):
                return val.timestamp()
            return str(val)

        self.items.sort(key=sort_key, reverse=(direction == -1))
        return self

    def __iter__(self):
        return iter(self.items)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        return self.items[index]


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class MySQLCollection:
    def __init__(self, db, table_name):
        self.db = db
        self.table_name = table_name

    def _get_connection(self):
        return self.db.get_connection()

    def _to_doc(self, row):
        if not row:
            return None
        doc = dict(row)
        if "id" in doc:
            doc["_id"] = str(doc["id"])
        # Parse JSON fields if string
        for key in ["skills", "eligibility", "skills_required", "feedback"]:
            if key in doc and isinstance(doc[key], str):
                try:
                    doc[key] = json.loads(doc[key])
                except Exception:
                    pass
        return doc

    def find_one(self, query=None, projection=None):
        query = query or {}
        conn = self._get_connection()
        try:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                where_clauses = []
                params = []
                for k, v in query.items():
                    col = "id" if k in ["_id", "id"] else k
                    if isinstance(v, dict):
                        if "$in" in v:
                            in_p = ", ".join(["%s"] * len(v["$in"]))
                            where_clauses.append(f"`{col}` IN ({in_p})")
                            params.extend(v["$in"])
                    else:
                        where_clauses.append(f"`{col}` = %s")
                        params.append(str(v) if k in ["_id", "id"] else v)
                
                sql = f"SELECT * FROM `{self.table_name}`"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                sql += " LIMIT 1"

                cursor.execute(sql, params)
                row = cursor.fetchone()
                return self._to_doc(row)
        finally:
            conn.close()

    def find(self, query=None, projection=None):
        query = query or {}
        conn = self._get_connection()
        try:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                where_clauses = []
                params = []
                for k, v in query.items():
                    col = "id" if k in ["_id", "id"] else k
                    if isinstance(v, dict):
                        if "$in" in v:
                            in_p = ", ".join(["%s"] * len(v["$in"]))
                            where_clauses.append(f"`{col}` IN ({in_p})")
                            params.extend(v["$in"])
                    else:
                        where_clauses.append(f"`{col}` = %s")
                        params.append(str(v) if k in ["_id", "id"] else v)
                
                sql = f"SELECT * FROM `{self.table_name}`"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)

                cursor.execute(sql, params)
                rows = cursor.fetchall()
                docs = [self._to_doc(r) for r in rows]
                return MySQLCursor(docs)
        finally:
            conn.close()

    def insert_one(self, doc):
        doc_copy = doc.copy()
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                fields = []
                params = []
                for k, v in doc_copy.items():
                    if k in ["_id"]:
                        continue
                    fields.append(f"`{k}`")
                    if isinstance(v, (dict, list)):
                        params.append(json.dumps(v))
                    else:
                        params.append(v)
                
                placeholders = ", ".join(["%s"] * len(fields))
                sql = f"INSERT INTO `{self.table_name}` ({', '.join(fields)}) VALUES ({placeholders})"
                cursor.execute(sql, params)
                conn.commit()
                inserted_id = str(cursor.lastrowid)
                return InsertResult(inserted_id)
        finally:
            conn.close()

    def update_one(self, query, update):
        query = query or {}
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                set_clauses = []
                params = []
                update_dict = update.get("$set", update)
                for k, v in update_dict.items():
                    set_clauses.append(f"`{k}` = %s")
                    if isinstance(v, (dict, list)):
                        params.append(json.dumps(v))
                    else:
                        params.append(v)

                where_clauses = []
                for k, v in query.items():
                    col = "id" if k in ["_id", "id"] else k
                    where_clauses.append(f"`{col}` = %s")
                    params.append(str(v) if k in ["_id", "id"] else v)

                sql = f"UPDATE `{self.table_name}` SET {', '.join(set_clauses)}"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                
                cursor.execute(sql, params)
                conn.commit()
                return UpdateResult(cursor.rowcount)
        finally:
            conn.close()

    def delete_one(self, query):
        query = query or {}
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                where_clauses = []
                params = []
                for k, v in query.items():
                    col = "id" if k in ["_id", "id"] else k
                    where_clauses.append(f"`{col}` = %s")
                    params.append(str(v) if k in ["_id", "id"] else v)

                sql = f"DELETE FROM `{self.table_name}`"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                sql += " LIMIT 1"
                
                cursor.execute(sql, params)
                conn.commit()
                return DeleteResult(cursor.rowcount)
        finally:
            conn.close()

    def count_documents(self, query=None):
        query = query or {}
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                where_clauses = []
                params = []
                for k, v in query.items():
                    col = "id" if k in ["_id", "id"] else k
                    where_clauses.append(f"`{col}` = %s")
                    params.append(str(v) if k in ["_id", "id"] else v)

                sql = f"SELECT COUNT(*) FROM `{self.table_name}`"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)

                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row[0] if row else 0
        finally:
            conn.close()


class MySQLDatabase:
    def __init__(self, host, port, user, password, db_name):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.db_name = db_name
        self.init_db_tables()

    def get_connection(self):
    return pymysql.connect(
        host=self.host,
        port=self.port,
        user=self.user,
        password=self.password,
        database=self.db_name,
        autocommit=True,
        ssl={"ssl": True}
    )

    def init_db_tables(self):
        # Connect to MySQL server without db selected to create database if not exists
        conn = pymysql.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            autocommit=True,
            ssl={"ssl": True}
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.db_name}`")
        finally:
            conn.close()

        # Connect to target DB and ensure basic tables exist
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(150) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,
                        role ENUM('student', 'admin', 'recruiter') NOT NULL DEFAULT 'student',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS students (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50),
                        phone VARCHAR(30),
                        gender VARCHAR(30) DEFAULT '',
                        course VARCHAR(100) DEFAULT 'MCA',
                        college VARCHAR(150),
                        semester VARCHAR(20),
                        cgpa VARCHAR(20),
                        skills TEXT,
                        resume_url TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                try:
                    cursor.execute("ALTER TABLE students ADD COLUMN gender VARCHAR(30) DEFAULT ''")
                except Exception:
                    pass
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS jobs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(150) NOT NULL,
                        company VARCHAR(150) NOT NULL,
                        description TEXT,
                        location VARCHAR(100),
                        salary VARCHAR(100),
                        eligibility TEXT,
                        skills_required TEXT,
                        application_deadline VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS applications (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50),
                        job_id VARCHAR(50),
                        status VARCHAR(50) DEFAULT 'applied',
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tests (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(150),
                        category VARCHAR(100),
                        duration INT,
                        total_questions INT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS test_results (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50),
                        test_id VARCHAR(50),
                        score INT,
                        total INT,
                        passed BOOLEAN,
                        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS resume_analyses (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50),
                        score INT,
                        feedback TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
        finally:
            conn.close()

        self._seed_default_users()

    def _seed_default_users(self):
        conn = self.get_connection()
        try:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT email FROM users WHERE email = %s", ("student@spms.com",))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO users (name, email, password, role)
                        VALUES (%s, %s, %s, %s)
                    """, ("Demo Student", "student@spms.com", generate_password_hash("password123"), "student"))

                cursor.execute("SELECT email FROM users WHERE email = %s", ("admin@spms.com",))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO users (name, email, password, role)
                        VALUES (%s, %s, %s, %s)
                    """, ("Placement Admin", "admin@spms.com", generate_password_hash("admin123"), "admin"))

                cursor.execute("SELECT email FROM users WHERE email = %s", ("recruiter@spms.com",))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO users (name, email, password, role)
                        VALUES (%s, %s, %s, %s)
                    """, ("Campus Recruiter", "recruiter@spms.com", generate_password_hash("recruiter123"), "recruiter"))
        finally:
            conn.close()

    def __getattr__(self, name):
        return MySQLCollection(self, name)

    def __getitem__(self, name):
        return MySQLCollection(self, name)
