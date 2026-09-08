"""
OPMD-AI: Persistent SQLite Database Engine
Manages User Authentication records, Case History logs, and Clinical Reviews.
Zero-dependency cryptographic password hashing using hashlib PBKDF2-HMAC.
"""

import os
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime
from typing import Optional, Dict, Any, List

DB_PATH = "database/opmd_cases.db"

def hash_password(plain_text: str) -> str:
    """
    Cryptographically secure password hashing using PBKDF2-HMAC SHA-256 with random salt.
    Format: 'pbkdf2:sha256:100000$<salt_hex>$<hash_hex>'
    """
    salt = secrets.token_hex(16)
    iterations = 100000
    key = hashlib.pbkdf2_hmac("sha256", plain_text.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"

def verify_password(plain_text: str, stored_hash: str) -> bool:
    """
    Verifies a password against the stored PBKDF2 hash.
    """
    try:
        if stored_hash.startswith("pbkdf2:sha256:"):
            parts = stored_hash.split("$")
            iterations = int(parts[0].split(":")[2])
            salt = parts[1]
            original_key = parts[2]
            key = hashlib.pbkdf2_hmac("sha256", plain_text.encode("utf-8"), salt.encode("utf-8"), iterations)
            return secrets.compare_digest(key.hex(), original_key)
        else:
            # Fallback for plain SHA256
            return secrets.compare_digest(hashlib.sha256(plain_text.encode("utf-8")).hexdigest(), stored_hash)
    except Exception:
        return False

def get_db_connection() -> sqlite3.Connection:
    os.makedirs("database", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """
    Initializes SQLite tables and seeds pre-configured Doctor and Student accounts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('doctor', 'student')),
        institution TEXT,
        professional_id TEXT,
        specialty TEXT,
        university TEXT,
        program TEXT,
        year_of_study TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 2. Cases Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        case_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        patient_id TEXT,
        age INTEGER,
        sex TEXT,
        lesion_site TEXT,
        habits TEXT,
        symptoms TEXT,
        image_path TEXT,
        predicted_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        probabilities_json TEXT NOT NULL,
        gradcam_path TEXT,
        risk_tier TEXT,
        clinician_notes TEXT,
        review_status TEXT DEFAULT 'Pending Review',
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()

    # Seed Doctor Account if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("ananya.rao@opmd-clinic.com",))
    if not cursor.fetchone():
        doc_hash = hash_password("Doctor@2026!")
        cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, role, institution, professional_id, specialty, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "doc-001",
            "Dr. Ananya Rao",
            "ananya.rao@opmd-clinic.com",
            doc_hash,
            "doctor",
            "City Center Oral Pathology & Oncology",
            "DENT-PATH-84920",
            "Oral & Maxillofacial Pathology",
            datetime.now().isoformat()
        ))

    # Seed Student Account if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("alex.chen@meduniv.edu",))
    if not cursor.fetchone():
        stu_hash = hash_password("Student@2026!")
        cursor.execute("""
        INSERT INTO users (id, full_name, email, password_hash, role, university, program, year_of_study, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "stu-001",
            "Alex Chen",
            "alex.chen@meduniv.edu",
            stu_hash,
            "student",
            "University of Dental & Medical Sciences",
            "BDS / Oral Oncology Resident",
            "Year 2 Resident",
            datetime.now().isoformat()
        ))

    # Seed initial cases if empty
    cursor.execute("SELECT COUNT(*) FROM cases")
    if cursor.fetchone()[0] == 0:
        sample_cases = [
            ("OPMD-2026-0812", "doc-001", "Dr. Ananya Rao", "doctor", "PT-4921", 54, "Male", "Right Buccal Mucosa", "Betel quid chewing for 12 years", "Restricted mouth opening, burning on spicy food", "", "OSF", 0.945, json.dumps({"Normal": 0.01, "OCA": 0.02, "OLK": 0.02, "OLP": 0.005, "OSF": 0.945}), "", "Requires Clinical Correlation & Habit Cessation", "Bilateral vertical fibrous bands palpable in buccal mucosa.", "Verified", "2026-08-20T10:30:00"),
            ("OPMD-2026-0819", "doc-001", "Dr. Ananya Rao", "doctor", "PT-8834", 48, "Female", "Lateral Border of Tongue", "Smoker (10 cigarettes/day)", "Asymptomatic non-scrapable white plaque", "", "OLK", 0.884, json.dumps({"Normal": 0.02, "OCA": 0.05, "OLK": 0.884, "OLP": 0.04, "OSF": 0.006}), "", "Requires Clinical Correlation & Specialist Review", "Incisional biopsy advised to rule out high-grade epithelial dysplasia.", "Pending Review", "2026-08-22T14:15:00"),
            ("OPMD-2026-0824", "stu-001", "Alex Chen", "student", "PT-1092", 62, "Male", "Floor of Mouth", "Heavy bidi smoking & alcohol consumption", "Indurated ulcer with everted edges", "", "OCA", 0.962, json.dumps({"Normal": 0.005, "OCA": 0.962, "OLK": 0.02, "OLP": 0.008, "OSF": 0.005}), "", "High Priority Clinical Evaluation", "Resident triage: Clinical features suspicious for malignant ulceration.", "Flagged", "2026-08-24T11:45:00")
        ]
        cursor.executemany("""
        INSERT INTO cases (case_id, user_id, user_name, user_role, patient_id, age, sex, lesion_site, habits, symptoms, image_path, predicted_class, confidence, probabilities_json, gradcam_path, risk_tier, clinician_notes, review_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_cases)

    conn.commit()
    conn.close()

def save_case_to_db(case_dict: Dict[str, Any]) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR REPLACE INTO cases (
            case_id, user_id, user_name, user_role, patient_id, age, sex,
            lesion_site, habits, symptoms, image_path, predicted_class,
            confidence, probabilities_json, gradcam_path, risk_tier,
            clinician_notes, review_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case_dict["case_id"],
            case_dict["user_id"],
            case_dict["user_name"],
            case_dict["user_role"],
            case_dict.get("patient_id", "ANON"),
            case_dict.get("age", None),
            case_dict.get("sex", "Unspecified"),
            case_dict.get("lesion_site", "Buccal Mucosa"),
            case_dict.get("habits", "None reported"),
            case_dict.get("symptoms", "None reported"),
            case_dict.get("image_path", ""),
            case_dict["predicted_class"],
            float(case_dict["confidence"]),
            json.dumps(case_dict.get("probabilities", {})),
            case_dict.get("gradcam_path", ""),
            case_dict.get("risk_tier", "Requires Review"),
            case_dict.get("clinician_notes", ""),
            case_dict.get("review_status", "Pending Review"),
            case_dict.get("created_at", datetime.now().isoformat())
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB ERROR] Error saving case: {e}")
        return False
    finally:
        conn.close()

def fetch_all_cases(user_id: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id and role == "student":
        cursor.execute("SELECT * FROM cases WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM cases ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        try:
            d["probabilities"] = json.loads(d.get("probabilities_json", "{}"))
        except:
            d["probabilities"] = {}
        results.append(d)
    return results

def update_case_review(case_id: str, new_status: str, notes: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE cases SET review_status = ?, clinician_notes = ? WHERE case_id = ?", (new_status, notes, case_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB ERROR] Error updating review: {e}")
        return False
    finally:
        conn.close()

init_database()
