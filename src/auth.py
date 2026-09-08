"""
OPMD-AI: Authentication & Role-Based Access Engine
Implements secure cryptographic password verification and persistent SQLite user verification.
Strictly supports 'doctor' and 'student' roles.
"""

import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

from src.database import get_db_connection, hash_password, verify_password

def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    if not password or len(password) < 8:
        return False, "Password must contain at least 8 characters."
    return True, None

def register_user(
    full_name: str,
    email: str,
    password: str,
    role: str,
    institution: str = "",
    professional_id: str = "",
    specialty: str = "",
    university: str = "",
    program: str = "",
    year_of_study: str = ""
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    normalized_email = email.strip().lower()
    
    if not full_name.strip():
        return False, None, "Full Name is required."
    if not normalized_email or "@" not in normalized_email:
        return False, None, "Please provide a valid email address."
    if role not in ["doctor", "student"]:
        return False, None, "Invalid role. Supported roles: 'doctor' and 'student'."

    pass_ok, pass_err = validate_password_strength(password)
    if not pass_ok:
        return False, None, pass_err

    # Secure salted hash
    password_hash = hash_password(password)
    user_id = f"usr-{int(datetime.now().timestamp())}"
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE email = ?", (normalized_email,))
        if cursor.fetchone():
            return False, None, "An account with this email address already exists."

        cursor.execute("""
        INSERT INTO users (
            id, full_name, email, password_hash, role,
            institution, professional_id, specialty,
            university, program, year_of_study, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, full_name.strip(), normalized_email, password_hash, role,
            institution.strip() if role == "doctor" else None,
            professional_id.strip() if role == "doctor" else None,
            specialty.strip() if role == "doctor" else None,
            university.strip() if role == "student" else None,
            program.strip() if role == "student" else None,
            year_of_study.strip() if role == "student" else None,
            now_str
        ))
        conn.commit()

        user_dict = {
            "id": user_id,
            "full_name": full_name.strip(),
            "email": normalized_email,
            "role": role,
            "institution": institution.strip(),
            "professional_id": professional_id.strip(),
            "specialty": specialty.strip(),
            "university": university.strip(),
            "program": program.strip(),
            "year_of_study": year_of_study.strip(),
            "created_at": now_str
        }
        return True, user_dict, None
    except Exception as e:
        return False, None, f"Database registration error: {str(e)}"
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    normalized_email = email.strip().lower()
    if not normalized_email or not password:
        return False, None, "Please provide both email address and password."

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (normalized_email,))
        row = cursor.fetchone()
        if not row:
            return False, None, "No account found with this email. Please sign up first."

        user_data = dict(row)
        stored_hash = user_data.get("password_hash", "")

        if verify_password(password, stored_hash):
            user_data.pop("password_hash", None)
            return True, user_data, None
        else:
            return False, None, "Incorrect password. Please verify your credentials."
    except Exception as e:
        return False, None, f"Authentication error: {str(e)}"
    finally:
        conn.close()

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d.pop("password_hash", None)
        return d
    return None
