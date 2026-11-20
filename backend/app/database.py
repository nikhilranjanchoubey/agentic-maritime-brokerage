"""
SQLite Database Layer for Agentic Maritime Brokerage Platform.
Stores users, search history, saved routes, and platform activity.
"""

import os
import sqlite3
import random
import uuid
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
            status TEXT NOT NULL DEFAULT 'Active',
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            country TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            last_login TEXT
        )
    """)

    # Ensure profile and status columns exist if table was previously created
    for col, col_type in [
        ("status", "TEXT DEFAULT 'Active'"),
        ("phone", "TEXT DEFAULT ''"),
        ("address", "TEXT DEFAULT ''"),
        ("country", "TEXT DEFAULT ''")
    ]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Ensure booking_status and dispatch_status exist in bookings table
    for col, col_type in [
        ("booking_status", "TEXT DEFAULT 'Pending'"),
        ("dispatch_status", "TEXT DEFAULT 'Pending Approval'")
    ]:
        try:
            cursor.execute(f"ALTER TABLE bookings ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Ensure remark_type exists in shipment_tracking_events table
    try:
        cursor.execute("ALTER TABLE shipment_tracking_events ADD COLUMN remark_type TEXT DEFAULT 'system'")
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

    # Shipment Bookings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            user_email TEXT NOT NULL,
            route_id TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            cargo_desc TEXT NOT NULL,
            cargo_type TEXT NOT NULL,
            containers INTEGER NOT NULL,
            shipper_name TEXT NOT NULL,
            contact_phone TEXT NOT NULL,
            pickup_address TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            pickup_date TEXT NOT NULL,
            current_status TEXT NOT NULL DEFAULT 'Order Placed',
            transit_days INTEGER DEFAULT 0,
            distance_nm INTEGER DEFAULT 0,
            transshipments INTEGER DEFAULT 0,
            freight_usd REAL DEFAULT 0.0,
            intermediate_port TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Shipment Tracking Events Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shipment_tracking_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT NOT NULL,
            status TEXT NOT NULL,
            remarks TEXT DEFAULT '',
            intermediate_port TEXT DEFAULT '',
            updated_by TEXT DEFAULT 'System',
            timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
        )
    """)

    conn.commit()

    # Seed Default Accounts if they don't already exist
    seed_accounts = [
        {
            "email": "admin@gmail.com",
            "password": "admin123",
            "full_name": "Admin",
            "role": "admin",
            "company": "",
            "phone": "9876543210",
            "address": "Bengaluru"
        },
        {
            "email": "nikhil@gmail.com",
            "password": "nikhil123",
            "full_name": "Nikhil",
            "role": "user",
            "company": "",
            "phone": "9876123450",
            "address": "Jaipur"
        }
    ]

    for acc in seed_accounts:
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (acc["email"].lower(),))
        existing = cursor.fetchone()
        if not existing:
            pwd_hash, salt = hash_password(acc["password"])
            now = datetime.utcnow().isoformat()
            cursor.execute("""
                INSERT INTO users (email, password_hash, salt, full_name, role, company, phone, address, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (acc["email"].lower(), pwd_hash, salt, acc["full_name"], acc["role"], acc.get("company", ""), acc.get("phone", ""), acc.get("address", ""), now))

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


def create_user(
    email: str,
    password_hash: str,
    salt: str,
    full_name: str,
    role: str = "user",
    company: str = "",
    phone: str = "",
    address: str = ""
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    # Ensure consecutive sequential IDs starting from MAX(id) + 1 (e.g. 3, 4, 5...)
    cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM users")
    next_id = cursor.fetchone()[0]
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, salt, full_name, role, company, phone, address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (next_id, email.strip().lower(), password_hash, salt, full_name.strip(), role, company.strip(), phone.strip(), address.strip(), now))
    cursor.execute("UPDATE sqlite_sequence SET seq = ? WHERE name = 'users'", (next_id,))
    conn.commit()
    conn.close()
    return get_user_by_id(next_id)


def delete_user(user_id: int) -> bool:
    """Permanently delete a user account and resync the sequential user sequence."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_routes WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM shipment_searches WHERE user_id = ? OR user_email IN (SELECT email FROM users WHERE id = ?)", (user_id, user_id))
    cursor.execute("DELETE FROM bookings WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    deleted = cursor.rowcount > 0
    cursor.execute("UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM users) WHERE name = 'users'")
    conn.commit()
    conn.close()
    return deleted


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
        SELECT id, email, full_name, role, company, status, phone, address, country, created_at, last_login
        FROM users ORDER BY id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def admin_create_user(
    email: str,
    password_hash: str,
    salt: str,
    full_name: str,
    role: str = "user",
    company: str = "",
    status: str = "Active"
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    # Ensure consecutive sequential IDs: 3, 4, 5...
    cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM users")
    next_id = cursor.fetchone()[0]
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, salt, full_name, role, company, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (next_id, email.strip().lower(), password_hash, salt, full_name.strip(), role.strip().lower(), company.strip(), status.strip(), now))
    cursor.execute("UPDATE sqlite_sequence SET seq = ? WHERE name = 'users'", (next_id,))
    conn.commit()
    conn.close()
    return get_user_by_id(next_id)


def admin_update_user(
    user_id: int,
    full_name: str,
    email: str,
    role: str,
    company: str = "",
    status: str = "Active"
) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users
        SET full_name = ?, email = ?, role = ?, company = ?, status = ?
        WHERE id = ?
    """, (full_name.strip(), email.strip().lower(), role.strip().lower(), company.strip(), status.strip(), user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


def toggle_user_status(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    current_status = (row["status"] or "Active").strip()
    new_status = "Active" if current_status.lower() in ["inactive", "deactivated"] else "Deactivated"
    cursor.execute("UPDATE users SET status = ? WHERE id = ?", (new_status, user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


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

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
    registered_shippers = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM bookings")
    total_bookings = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM bookings 
        WHERE LOWER(booking_status) = 'pending'
    """)
    pending_approvals = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT origin || ' - ' || destination) FROM bookings")
    booked_lanes = cursor.fetchone()[0]

    # Active trade lanes: distinct lanes in bookings or active route network
    active_trade_lanes = booked_lanes if booked_lanes > 0 else min(total_routes_count, 12)

    cursor.execute("""
        SELECT COALESCE(SUM(freight_usd), 0.0) FROM bookings 
        WHERE LOWER(booking_status) = 'approved'
    """)
    total_freight_booked = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM shipment_searches")
    total_searches = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM saved_routes")
    total_saved = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT origin || '-' || destination) FROM shipment_searches")
    unique_searched_corridors = cursor.fetchone()[0]

    conn.close()

    return {
        "total_users": total_users,
        "registered_shippers": registered_shippers,
        "total_bookings": total_bookings,
        "pending_approvals": pending_approvals,
        "active_trade_lanes": active_trade_lanes,
        "total_freight_booked": round(float(total_freight_booked or 0.0), 2),
        "total_routes": total_routes_count,
        "total_searches": total_searches,
        "total_saved_routes": total_saved,
        "unique_corridors_searched": unique_searched_corridors,
        "platform_status": "Operational",
        "engine_version": "Agentic Maritime Brokerage 2.0"
    }


# ==============================================================================
# SHIPMENT BOOKINGS & TRACKING SYSTEM
# ==============================================================================

DISPATCH_MILESTONES = [
    "Booking Confirmed",
    "Cargo Received at Origin Port",
    "Loaded onto Vessel",
    "In Transit",
    "Arrived at Destination Port",
    "Delivered"
]

VALID_SHIPMENT_STAGES = [
    "Booking Confirmed",
    "Cargo Received at Origin Port",
    "Loaded onto Vessel",
    "In Transit",
    "Arrived at Destination Port",
    "Delivered",
    "Cancelled"
]


def get_stages_for_booking(booking: Dict[str, Any]) -> List[str]:
    """Return ordered 6 core maritime shipping stages in exact lifecycle sequence."""
    return list(DISPATCH_MILESTONES)


def generate_booking_id() -> str:
    """Generate a clean, professional unique booking ID (e.g. BK-2026-XXXXXX)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    year = datetime.utcnow().strftime("%Y")
    while True:
        num = random.randint(100000, 999999)
        cand = f"BK-{year}-{num}"
        cursor.execute("SELECT id FROM bookings WHERE booking_id = ?", (cand,))
        if not cursor.fetchone():
            conn.close()
            return cand


def create_booking(booking_data: Dict[str, Any], user_id: int, user_email: str) -> Dict[str, Any]:
    """Create a new shipment booking with initial 'Pending' status and record tracking event."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    booking_id = generate_booking_id()

    cursor.execute("""
        INSERT INTO bookings (
            booking_id, user_id, user_email, route_id, origin, destination,
            cargo_desc, cargo_type, containers, shipper_name, contact_phone,
            pickup_address, delivery_address, pickup_date, current_status,
            booking_status, dispatch_status,
            transit_days, distance_nm, transshipments, freight_usd, intermediate_port,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        user_id,
        user_email,
        booking_data.get("route_id", "R-GEN"),
        booking_data.get("origin", "").strip(),
        booking_data.get("destination", "").strip(),
        booking_data.get("cargo_desc", "").strip(),
        booking_data.get("cargo_type", "Standard Dry").strip(),
        max(1, int(booking_data.get("containers", 1))),
        booking_data.get("shipper_name", "").strip(),
        booking_data.get("contact_phone", "").strip(),
        booking_data.get("pickup_address", "").strip(),
        booking_data.get("delivery_address", "").strip(),
        booking_data.get("pickup_date", "").strip(),
        "Pending Approval",
        "Pending",
        "Pending Approval",
        int(booking_data.get("transit_days", 0)),
        int(booking_data.get("distance_nm", 0)),
        int(booking_data.get("transshipments", 0)),
        float(booking_data.get("freight_usd", 0.0)),
        booking_data.get("intermediate_port", "").strip(),
        now_iso,
        now_iso
    ))

    # Record first tracking timeline event: "Booking Request Submitted"
    cursor.execute("""
        INSERT INTO shipment_tracking_events (
            booking_id, status, remarks, intermediate_port, updated_by, timestamp, created_at, remark_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        "Booking Request Submitted",
        "Shipment booking request submitted successfully and is awaiting administrator review.",
        booking_data.get("intermediate_port", "").strip(),
        "System",
        now_iso,
        now_iso,
        "system"
    ))

    conn.commit()
    conn.close()
    return get_booking_by_id(booking_id)


def approve_booking(booking_id: str, admin_name: str = "Administrator") -> Optional[Dict[str, Any]]:
    """Approve a pending shipment booking."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return None

    if booking["booking_status"] != "Pending":
        conn.close()
        return None

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE bookings
        SET booking_status = 'Approved',
            dispatch_status = 'Booking Confirmed',
            current_status = 'Booking Confirmed',
            updated_at = ?
        WHERE UPPER(booking_id) = ?
    """, (now_iso, booking_id.strip().upper()))

    cursor.execute("""
        INSERT INTO shipment_tracking_events (
            booking_id, status, remarks, intermediate_port, updated_by, timestamp, created_at, remark_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id.strip().upper(),
        "Booking Confirmed",
        "Booking approved by the Port Administrator.",
        booking["intermediate_port"] or "",
        admin_name,
        now_iso,
        now_iso,
        "system"
    ))

    conn.commit()
    conn.close()
    return get_booking_by_id(booking_id)


def reject_booking(booking_id: str, admin_name: str = "Administrator", reason: str = "") -> Optional[Dict[str, Any]]:
    """Reject a pending shipment booking."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return None

    if booking["booking_status"] != "Pending":
        conn.close()
        return None

    clean_reason = reason.strip() if reason and reason.strip() else "Capacity or cargo constraints"
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE bookings
        SET booking_status = 'Rejected',
            dispatch_status = 'Rejected',
            current_status = 'Rejected',
            updated_at = ?
        WHERE UPPER(booking_id) = ?
    """, (now_iso, booking_id.strip().upper()))

    remarks = f"Booking request rejected by Port Administrator. Reason: {clean_reason}"

    cursor.execute("""
        INSERT INTO shipment_tracking_events (
            booking_id, status, remarks, intermediate_port, updated_by, timestamp, created_at, remark_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id.strip().upper(),
        "Booking Rejected",
        remarks,
        booking["intermediate_port"] or "",
        admin_name,
        now_iso,
        now_iso,
        "admin"
    ))

    conn.commit()
    conn.close()
    return get_booking_by_id(booking_id)


def get_pending_bookings() -> List[Dict[str, Any]]:
    """Retrieve all bookings awaiting administrator approval (strictly Pending)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM bookings
        WHERE LOWER(booking_status) = 'pending'
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_booking_by_id(booking_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve booking by its unique ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_bookings(user_id: int) -> List[Dict[str, Any]]:
    """Retrieve all bookings created by a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM bookings
        WHERE user_id = ?
        ORDER BY id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_bookings(
    search: Optional[str] = None,
    booking_status: Optional[str] = None,
    dispatch_status: Optional[str] = None,
    status_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Admin function: Retrieve all bookings with search, booking_status and dispatch_status filtering."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM bookings WHERE 1=1"
    params = []

    if search:
        s = f"%{search.strip().lower()}%"
        query += " AND (LOWER(booking_id) LIKE ? OR LOWER(shipper_name) LIKE ? OR LOWER(user_email) LIKE ? OR LOWER(origin) LIKE ? OR LOWER(destination) LIKE ? OR LOWER(route_id) LIKE ?)"
        params.extend([s, s, s, s, s, s])

    # 1. Dedicated booking_status filter (Pending, Approved, Rejected, Cancelled)
    if booking_status and booking_status != "All":
        bs = booking_status.strip().lower()
        if bs == "cancelled":
            query += " AND (LOWER(booking_status) = 'cancelled' OR LOWER(current_status) = 'cancelled' OR LOWER(dispatch_status) LIKE '%cancelled%')"
        else:
            query += " AND LOWER(booking_status) = ?"
            params.append(bs)

    # 2. Dedicated dispatch_status filter (Booking Confirmed, Cargo Received at Origin Port, Loaded onto Vessel, In Transit, Arrived at Destination Port, Delivered)
    if dispatch_status and dispatch_status != "All":
        ds = dispatch_status.strip().lower()
        if ds in ["booking confirmed", "order placed"]:
            query += " AND (LOWER(dispatch_status) = 'booking confirmed' OR LOWER(dispatch_status) = 'order placed')"
        elif ds in ["cargo received at origin port", "cargo received at port"]:
            query += " AND (LOWER(dispatch_status) = 'cargo received at origin port' OR LOWER(dispatch_status) = 'cargo received at port')"
        else:
            query += " AND LOWER(dispatch_status) = ?"
            params.append(ds)

    # 3. Fallback for single status_filter parameter
    if status_filter and status_filter != "All" and not booking_status and not dispatch_status:
        sf = status_filter.strip().lower()
        if sf in ["pending", "approved", "rejected", "cancelled"]:
            if sf == "cancelled":
                query += " AND (LOWER(booking_status) = 'cancelled' OR LOWER(current_status) = 'cancelled' OR LOWER(dispatch_status) LIKE '%cancelled%')"
            else:
                query += " AND LOWER(booking_status) = ?"
                params.append(sf)
        elif sf in ["booking confirmed", "order placed", "cargo received at origin port", "cargo received at port", "loaded onto vessel", "in transit", "arrived at destination port", "delivered"]:
            if sf in ["booking confirmed", "order placed"]:
                query += " AND (LOWER(dispatch_status) = 'booking confirmed' OR LOWER(dispatch_status) = 'order placed')"
            elif sf in ["cargo received at origin port", "cargo received at port"]:
                query += " AND (LOWER(dispatch_status) = 'cargo received at origin port' OR LOWER(dispatch_status) = 'cargo received at port')"
            else:
                query += " AND LOWER(dispatch_status) = ?"
                params.append(sf)
        else:
            query += " AND (LOWER(booking_status) = ? OR LOWER(dispatch_status) = ?)"
            params.extend([sf, sf])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_tracking_history(booking_id: str) -> List[Dict[str, Any]]:
    """Retrieve all chronological tracking events for a booking."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM shipment_tracking_events
        WHERE UPPER(booking_id) = ?
        ORDER BY id ASC
    """, (booking_id.strip().upper(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_tracking_event(
    booking_id: str,
    status: str,
    remarks: str = "",
    updated_by: str = "Administrator",
    timestamp: Optional[str] = None,
    intermediate_port: str = "",
    remark_type: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Add a new status update event to a shipment and update its current status."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return None

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    event_time = timestamp.strip() if timestamp and timestamp.strip() else now_iso

    # If remarks are empty, generate short factual system remark based on event
    clean_remarks = remarks.strip() if remarks else ""
    if not clean_remarks:
        system_defaults = {
            "Booking Confirmed": "Booking approved by the Port Administrator.",
            "Cargo Received at Origin Port": "Cargo physically received and inspected at origin port facility.",
            "Loaded onto Vessel": "Container safely stowed and secured aboard container vessel.",
            "In Transit": "Vessel departed origin port and is underway along maritime corridor.",
            "Arrived at Destination Port": "Vessel berthed at destination port container terminal.",
            "Delivered": "Consignment discharged from vessel and delivered to destination consignee."
        }
        clean_remarks = system_defaults.get(status.strip(), f"Shipment status transitioned to {status.strip()}.")
        final_remark_type = "system"
        final_updated_by = "System"
    else:
        final_remark_type = remark_type or "admin"
        final_updated_by = updated_by.strip()

    # Update booking dispatch_status, current_status, intermediate_port (if provided), and updated_at
    if intermediate_port and intermediate_port.strip():
        cursor.execute("""
            UPDATE bookings
            SET dispatch_status = ?, current_status = ?, intermediate_port = ?, updated_at = ?
            WHERE UPPER(booking_id) = ?
        """, (status.strip(), status.strip(), intermediate_port.strip(), now_iso, booking_id.strip().upper()))
    else:
        cursor.execute("""
            UPDATE bookings
            SET dispatch_status = ?, current_status = ?, updated_at = ?
            WHERE UPPER(booking_id) = ?
        """, (status.strip(), status.strip(), now_iso, booking_id.strip().upper()))

    # Insert tracking timeline event
    cursor.execute("""
        INSERT INTO shipment_tracking_events (
            booking_id, status, remarks, intermediate_port, updated_by, timestamp, created_at, remark_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id.strip().upper(),
        status.strip(),
        clean_remarks,
        intermediate_port.strip() if intermediate_port else (booking["intermediate_port"] or ""),
        final_updated_by,
        event_time,
        now_iso,
        final_remark_type
    ))

    conn.commit()
    conn.close()
    return get_booking_by_id(booking_id)


def cancel_booking(
    booking_id: str,
    cancelled_by: str = "Shipper",
    reason: str = "Cancelled by user request",
    is_admin: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Cancels an active shipment booking without deleting the database record.
    Sets booking_status to 'Cancelled', current_status to 'Cancelled',
    dispatch_status to 'Cancelled by Administrator' or 'Cancelled by Shipper',
    and adds an audit event to shipment_tracking_events.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    b_id = booking_id.strip().upper()
    cursor.execute("SELECT * FROM bookings WHERE UPPER(booking_id) = ?", (b_id,))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return None

    if booking["dispatch_status"] == "Delivered":
        conn.close()
        return None  # Cannot cancel after delivery

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    clean_reason = reason.strip() if reason and reason.strip() else "Cancellation requested."
    dispatch_title = "Cancelled by Administrator" if is_admin else "Cancelled by Shipper"
    remark_type = "admin" if is_admin else "shipper"

    cursor.execute("""
        UPDATE bookings
        SET booking_status = 'Cancelled',
            current_status = 'Cancelled',
            dispatch_status = ?,
            updated_at = ?
        WHERE UPPER(booking_id) = ?
    """, (dispatch_title, now, b_id))

    # Record timeline event in tracking history
    remarks = f"Booking cancelled by {cancelled_by}. Reason: {clean_reason}"
    cursor.execute("""
        INSERT INTO shipment_tracking_events (
            booking_id, status, remarks, intermediate_port, updated_by, timestamp, created_at, remark_type
        )
        VALUES (?, 'Booking Cancelled', ?, '', ?, ?, ?, ?)
    """, (b_id, remarks, cancelled_by, now, now, remark_type))

    conn.commit()
    conn.close()
    return get_booking_by_id(b_id)
    return get_booking_by_id(b_id)


def delete_booking(booking_id: str) -> bool:
    """Permanently delete a booking and its entire tracking timeline."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shipment_tracking_events WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    cursor.execute("DELETE FROM bookings WHERE UPPER(booking_id) = ?", (booking_id.strip().upper(),))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

