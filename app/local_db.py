import os
import json
from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash

DB_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "local_db.json")


class Cursor:
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


class LocalCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _matches(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            if key == "_id":
                if str(doc.get("_id")) != str(val):
                    return False
            elif isinstance(val, dict):
                # handle basic mongo operators like $in, $ne
                if "$in" in val and doc.get(key) not in val["$in"]:
                    return False
                if "$ne" in val and doc.get(key) == val["$ne"]:
                    return False
            else:
                doc_val = doc.get(key)
                if isinstance(doc_val, str) and isinstance(val, str):
                    if doc_val.lower() != val.lower():
                        return False
                elif doc_val != val:
                    return False
        return True

    def _project(self, doc, projection=None):
        if not projection or not isinstance(projection, dict):
            return doc
        is_inclusion = any(v == 1 for k, v in projection.items() if k != "_id")
        if is_inclusion:
            projected = {}
            if projection.get("_id", 1) != 0 and "_id" in doc:
                projected["_id"] = doc["_id"]
            for k, v in projection.items():
                if k != "_id" and v == 1 and k in doc:
                    projected[k] = doc[k]
            return projected
        else:
            projected = doc.copy()
            for k, v in projection.items():
                if v == 0 and k in projected:
                    del projected[k]
            return projected

    def find_one(self, query=None, projection=None):
        query = query or {}
        for doc in self.db.data.get(self.name, []):
            if self._matches(doc, query):
                return self._project(doc.copy(), projection)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        matches = [self._project(doc.copy(), projection) for doc in self.db.data.get(self.name, []) if self._matches(doc, query)]
        return Cursor(matches)

    def insert_one(self, doc):
        doc = doc.copy()
        if "_id" not in doc or not doc["_id"]:
            doc["_id"] = ObjectId()
        elif not isinstance(doc["_id"], ObjectId):
            doc["_id"] = ObjectId(str(doc["_id"]))

        if "created_at" not in doc:
            doc["created_at"] = datetime.utcnow()

        if self.name not in self.db.data:
            self.db.data[self.name] = []

        self.db.data[self.name].append(doc)
        self.db.save()
        return InsertResult(doc["_id"])

    def update_one(self, query, update):
        query = query or {}
        for doc in self.db.data.get(self.name, []):
            if self._matches(doc, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        doc[k] = v
                else:
                    for k, v in update.items():
                        doc[k] = v
                self.db.save()
                return UpdateResult(1)
        return UpdateResult(0)

    def delete_one(self, query):
        query = query or {}
        collection_list = self.db.data.get(self.name, [])
        for i, doc in enumerate(collection_list):
            if self._matches(doc, query):
                del collection_list[i]
                self.db.save()
                return DeleteResult(1)
        return DeleteResult(0)

    def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self.db.data.get(self.name, []) if self._matches(doc, query))


class LocalDatabase:
    def __init__(self):
        self.data = {
            "users": [],
            "students": [],
            "jobs": [],
            "applications": [],
            "tests": [],
            "test_results": [],
            "resume_analyses": []
        }
        self.load()
        self._seed_default_users()

    def __getattr__(self, name):
        return LocalCollection(self, name)

    def __getitem__(self, name):
        return LocalCollection(self, name)

    def load(self):
        if os.path.exists(DB_FILE_PATH):
            try:
                with open(DB_FILE_PATH, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    for col, docs in raw_data.items():
                        self.data[col] = []
                        for d in docs:
                            doc = d.copy()
                            if "_id" in doc:
                                doc["_id"] = ObjectId(doc["_id"])
                            if "created_at" in doc and isinstance(doc["created_at"], str):
                                try:
                                    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
                                except Exception:
                                    pass
                            self.data[col].append(doc)
            except Exception as e:
                print(f"Error loading local DB file: {e}")

    def save(self):
        os.makedirs(os.path.dirname(DB_FILE_PATH), exist_ok=True)
        serializable = {}
        for col, docs in self.data.items():
            serializable[col] = []
            for d in docs:
                item = {}
                for k, v in d.items():
                    if isinstance(v, ObjectId):
                        item[k] = str(v)
                    elif isinstance(v, datetime):
                        item[k] = v.isoformat()
                    else:
                        item[k] = v
                serializable[col].append(item)

        with open(DB_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2)

    def _seed_default_users(self):
        users_col = self.data.get("users", [])
        if not any(u.get("email") == "student@spms.com" for u in users_col):
            users_col.append({
                "_id": ObjectId(),
                "name": "Demo Student",
                "email": "student@spms.com",
                "password": generate_password_hash("password123"),
                "role": "student",
                "created_at": datetime.utcnow()
            })

        if not any(u.get("email") == "admin@spms.com" for u in users_col):
            users_col.append({
                "_id": ObjectId(),
                "name": "Placement Admin",
                "email": "admin@spms.com",
                "password": generate_password_hash("admin123"),
                "role": "admin",
                "created_at": datetime.utcnow()
            })

        if not any(u.get("email") == "recruiter@spms.com" for u in users_col):
            users_col.append({
                "_id": ObjectId(),
                "name": "Campus Recruiter",
                "email": "recruiter@spms.com",
                "password": generate_password_hash("recruiter123"),
                "role": "recruiter",
                "created_at": datetime.utcnow()
            })

        self.save()
