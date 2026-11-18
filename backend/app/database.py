"""
SQLite Database Layer for Agentic Maritime Brokerage Platform.
Stores users, search history, saved routes, and platform activity.
"""

import os
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.auth import hash_password

DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "data", "maritime.db")
)


def get_db_connection():
    """Get a connection to the SQLite database with row factory."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize SQLite tables and seed default administrator and demo user accounts."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            company TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            country TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            last_login TEXT
        )
    """)

    # Ensure profile columns exist if table was previously created
    for col, col_type in [("phone", "TEXT DEFAULT ''"), ("address", "TEXT DEFAULT ''"), ("country", "TEXT DEFAULT ''")]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Shipment Searches History
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shipment_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_email TEXT,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            cargo_type TEXT NOT NULL,
            containers INTEGER NOT NULL,
            best_route_id TEXT,
            best_route_type TEXT,
            transit_days INTEGER,
            distance_nm INTEGER,
            transshipments INTEGER,
            base_freight_usd REAL,
            total_freight_usd REAL,
            route_score REAL,
            created_at TEXT NOT NULL
        )
    """)

    # Saved Routes for Users
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            route_id TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            route_type TEXT NOT NULL,
            distance_nm INTEGER NOT NULL,
            transit_days INTEGER NOT NULL,
            base_freight_usd REAL NOT NULL,
            route_score REAL NOT NULL,
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    conn.commit()

    # Seed Default Accounts if they don't already exist
    seed_accounts = [
        {
            "email": "admin@maritime.com",
            "password": "Admin@12345",
            "full_name": "Maritime Admin Director",
            "role": "admin",
            "company": "Agentic Maritime Headquarters"
        },
        {
            "email": "broker@maritime.com",
            "password": "Broker@12345",
            "full_name": "Commercial Freight Broker",
            "role": "user",
            "company": "Pacific Global Freight Forwarding"
        }
    ]

    for acc in seed_accounts:
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (acc["email"].lower(),))
        existing = cursor.fetchone()
        if not existing:
            pwd_hash, salt = hash_password(acc["password"])
            now = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT INTO users (email, password_hash, salt, full_name, role, company, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (acc["email"].lower(), pwd_hash, salt, acc["full_name"], acc["role"], acc["company"], now))

    conn.commit()
    conn.close()


# ==============================================================================
# USER OPERATIONS
# ==============================================================================

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_email = email.strip().lower()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,))
    row = cursor.fetchone()
    
    # Interchangeability fallback between @maritime.local and @maritime.com
    if not row:
        if clean_email.endswith("@maritime.local"):
            alt = clean_email.replace("@maritime.local", "@maritime.com")
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (alt,))
            row = cursor.fetchone()
        elif clean_email.endswith("@maritime.com"):
            alt = clean_email.replace("@maritime.com", "@maritime.local")
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (alt,))
            row = cursor.fetchone()

    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(email: str, password_hash: str, salt: str, full_name: str, role: str = "user", company: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO users (email, password_hash, salt, full_name, role, company, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (email.strip().lower(), password_hash, salt, full_name.strip(), role, company.strip(), now))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return get_user_by_id(user_id)


def update_last_login(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user_id))
    conn.commit()
    conn.close()


def update_user_profile(
    user_id: int,
    full_name: str,
    company: str = "",
    phone: str = "",
    address: str = "",
    country: str = ""
) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users
        SET full_name = ?, company = ?, phone = ?, address = ?, country = ?
        WHERE id = ?
    """, (full_name.strip(), company.strip(), phone.strip(), address.strip(), country.strip(), user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


def update_user_password(user_id: int, new_password_hash: str, new_salt: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users
        SET password_hash = ?, salt = ?
        WHERE id = ?
    """, (new_password_hash, new_salt, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def list_all_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, role, company, created_at, last_login
        FROM users ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==============================================================================
# SEARCH HISTORY & ACTIVITY
# ==============================================================================

def log_search(
    origin: str,
    destination: str,
    cargo_type: str,
    containers: int,
    result: Dict[str, Any],
    user_id: Optional[int] = None,
    user_email: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    rec = result.get("recommended_route", {})
    
    cursor.execute("""
        INSERT INTO shipment_searches (
            user_id, user_email, origin, destination, cargo_type, containers,
            best_route_id, best_route_type, transit_days, distance_nm,
            transshipments, base_freight_usd, total_freight_usd, route_score, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        user_email,
        origin,
        destination,
        cargo_type,
        containers,
        rec.get("route_id"),
        rec.get("route_type"),
        rec.get("transit_days"),
        rec.get("distance_nm"),
        rec.get("transshipments"),
        rec.get("base_freight_usd"),
        rec.get("total_freight_usd"),
        rec.get("route_score"),
        now
    ))
    conn.commit()
    conn.close()


def get_user_searches(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM shipment_searches
        WHERE user_id = ?
        ORDER BY id DESC LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_recent_searches(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM shipment_searches
        ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==============================================================================
# SAVED ROUTES
# ==============================================================================

def save_route(user_id: int, route_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO saved_routes (
            user_id, route_id, origin, destination, route_type,
            distance_nm, transit_days, base_freight_usd, route_score, notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        route_data.get("route_id", "R_CUSTOM"),
        route_data["origin"],
        route_data["destination"],
        route_data.get("route_type", "Standard"),
        int(route_data.get("distance_nm", 0)),
        int(route_data.get("transit_days", 0)),
        float(route_data.get("base_freight_usd", 0.0)),
        float(route_data.get("route_score", 100.0)),
        route_data.get("notes", ""),
        now
    ))
    conn.commit()
    saved_id = cursor.lastrowid
    cursor.execute("SELECT * FROM saved_routes WHERE id = ?", (saved_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)


def get_saved_routes(user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM saved_routes
        WHERE user_id = ?
        ORDER BY id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_saved_route(user_id: int, saved_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_routes WHERE id = ? AND user_id = ?", (saved_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ==============================================================================
# ADMIN STATISTICS
# ==============================================================================

def get_platform_stats(total_routes_count: int) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM shipment_searches")
    total_searches = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM saved_routes")
    total_saved = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT origin || '-' || destination) FROM shipment_searches")
    unique_searched_corridors = cursor.fetchone()[0]

    conn.close()

    return {
        "total_users": total_users,
        "total_routes": total_routes_count,
        "total_searches": total_searches,
        "total_saved_routes": total_saved,
        "unique_corridors_searched": unique_searched_corridors,
        "platform_status": "Operational",
        "engine_version": "Agentic Maritime 2.0 - Route Intelligence"
    }
