import os
import re
import math
from datetime import datetime
import pandas as pd
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    RouteRequest,
    LoginRequest,
    RegisterRequest,
    SavedRouteRequest,
    RouteRecordCreate,
    RouteRecordUpdate,
    UserProfileUpdateRequest,
    UserPasswordChangeRequest,
    AdminUserCreateRequest,
    AdminUserUpdateRequest,
    ShipmentBookingRequest,
    ShipmentStatusUpdateRequest
)
from app.agents.route_agent import RouteAgent
from app.data.ports import get_all_ports, get_port_by_name
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from app.database import (
    init_db,
    get_user_by_email,
    get_user_by_id,
    create_user,
    update_last_login,
    list_all_users,
    admin_create_user,
    admin_update_user,
    toggle_user_status,
    delete_user,
    log_search,
    get_user_searches,
    get_recent_searches,
    save_route,
    get_saved_routes,
    delete_saved_route,
    get_platform_stats,
    update_user_profile,
    update_user_password,
    create_booking,
    get_booking_by_id,
    get_user_bookings,
    get_all_bookings,
    get_tracking_history,
    add_tracking_event,
    get_stages_for_booking,
    VALID_SHIPMENT_STAGES,
    approve_booking,
    reject_booking,
    get_pending_bookings,
    cancel_booking,
    delete_booking
)

# Initialize database tables and seed default accounts
init_db()

app = FastAPI(
    title="Agentic Maritime Brokerage Platform",
    description="AI-powered maritime freight quotation and route intelligence platform",
    version="2.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Route Agent
route_agent = RouteAgent(os.path.dirname(os.path.abspath(__file__)))


# ==============================================================================
# AUTHENTICATION DEPENDENCIES (RBAC)
# ==============================================================================

def get_current_user(request: Request) -> dict:
    """Extract and verify JWT bearer token from request header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in."
        )

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again."
        )

    user = get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists."
        )

    user_status = (user.get("status") or "Active").strip().lower()
    if user_status in ["inactive", "deactivated"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated by the administrator. Please contact port administration (admin@gmail.com) to reactivate your account."
        )

    return user


def get_optional_user(request: Request) -> Optional[dict]:
    """Optionally extract user if Bearer token is provided, without failing if absent."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        return None

    return get_user_by_id(payload.get("sub"))


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Enforce administrator role for protected admin endpoints."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )
    return user


# ==============================================================================
# PUBLIC & SYSTEM ENDPOINTS
# ==============================================================================

@app.get("/")
def home():
    """Preserved root endpoint for platform heartbeat."""
    return {
        "message": "Agentic Maritime Brokerage API is running",
        "project": "Maritime Freight Quotation Platform",
        "status": "Operational",
        "version": "2.0.0"
    }


@app.get("/ports")
def list_ports():
    """Return searchable global ports with UN/LOCODE, country and coordinates."""
    return {"ports": get_all_ports()}


@app.get("/routes/origins")
def get_route_origins():
    """Return all available origin ports in the route dataset."""
    return {"origins": route_agent.get_available_origins()}


@app.get("/routes/destinations")
def get_route_destinations(origin: str):
    """Return all available destination ports for a selected origin port."""
    destinations = route_agent.get_available_destinations(origin)
    return {"origin": origin, "destinations": destinations}


@app.get("/popular-routes")
def popular_routes():
    """Curated list of high-volume international shipping corridors inspired by SkyTech."""
    corridors = [
        {
            "id": "corridor-1",
            "origin": "Chennai",
            "origin_country": "India",
            "origin_code": "INMAA",
            "destination": "Rotterdam",
            "destination_country": "Netherlands",
            "destination_code": "NLRTM",
            "distance_nm": 6420,
            "transit_days": 19,
            "category": "East-West Gateway",
            "badge": "★ PRIMARY CORRIDOR",
            "estimated_freight_usd": 2180,
            "image": "/assets/container-ship-sea.jpg"
        },
        {
            "id": "corridor-2",
            "origin": "Mumbai",
            "origin_country": "India",
            "origin_code": "INBOM",
            "destination": "Singapore",
            "destination_country": "Singapore",
            "destination_code": "SGSIN",
            "distance_nm": 2410,
            "transit_days": 6,
            "category": "Strait of Malacca Express",
            "badge": "⚡ EXPRESS DIRECT",
            "estimated_freight_usd": 950,
            "image": "/assets/aerial-cargo.jpg"
        },
        {
            "id": "corridor-3",
            "origin": "Shanghai",
            "origin_country": "China",
            "origin_code": "CNSHA",
            "destination": "Los Angeles",
            "destination_country": "United States",
            "destination_code": "USLAX",
            "distance_nm": 5700,
            "transit_days": 12,
            "category": "Transpacific Mega-Route",
            "badge": "★ TOP TRADE LANE",
            "estimated_freight_usd": 2350,
            "image": "/assets/port-cranes.jpg"
        },
        {
            "id": "corridor-4",
            "origin": "Singapore",
            "origin_country": "Singapore",
            "origin_code": "SGSIN",
            "destination": "Hamburg",
            "destination_country": "Germany",
            "destination_code": "DEHAM",
            "distance_nm": 8390,
            "transit_days": 21,
            "category": "Asia-Europe Trunk",
            "badge": "🌿 ECO MARITIME",
            "estimated_freight_usd": 3100,
            "image": "/assets/hero-port.jpg"
        },
        {
            "id": "corridor-5",
            "origin": "Jebel Ali",
            "origin_country": "United Arab Emirates",
            "origin_code": "AEJEA",
            "destination": "Rotterdam",
            "destination_country": "Netherlands",
            "destination_code": "NLRTM",
            "distance_nm": 6180,
            "transit_days": 15,
            "category": "Middle East European Link",
            "badge": "⚡ HIGH FREQUENCY",
            "estimated_freight_usd": 2380,
            "image": "/assets/auth-login.jpg"
        },
        {
            "id": "corridor-6",
            "origin": "Colombo",
            "origin_country": "Sri Lanka",
            "origin_code": "LKCMB",
            "destination": "Chennai",
            "destination_country": "India",
            "destination_code": "INMAA",
            "distance_nm": 385,
            "transit_days": 2,
            "category": "Subcontinent Feeder",
            "badge": "★ REGIONAL HUB",
            "estimated_freight_usd": 450,
            "image": "/assets/colombo-chennai.jpg"
        }
    ]
    return {"popular_routes": corridors}


# ==============================================================================
# ROUTE INTELLIGENCE ENGINE (PRESERVED & ENHANCED)
# ==============================================================================

@app.post("/analyze-route")
def analyze_route(request_body: RouteRequest, request: Request):
    """
    Main Route Intelligence endpoint.
    Maintains 100% backward compatibility with existing contract.
    """
    if request_body.origin.strip().lower() == request_body.destination.strip().lower():
        raise HTTPException(
            status_code=400,
            detail="Origin port and destination port cannot be identical."
        )

    result = route_agent.analyze_route(
        request_body.origin,
        request_body.destination,
        request_body.cargo_type,
        request_body.containers
    )

    # If user is authenticated, log search to history
    user = get_optional_user(request)
    user_id = user["id"] if user else None
    user_email = user["email"] if user else None

    if result.get("status") == "success":
        log_search(
            origin=request_body.origin,
            destination=request_body.destination,
            cargo_type=request_body.cargo_type,
            containers=request_body.containers,
            result=result,
            user_id=user_id,
            user_email=user_email
        )

    return result


# ==============================================================================
# AUTHENTICATION ENDPOINTS & VALIDATIONS
# ==============================================================================

def validate_mobile_number(mobile: Optional[str]) -> Optional[str]:
    """
    Validates mobile number against the strict rules:
    - Required: Cannot be empty
    - Digits only: Only 0-9 allowed
    - Length: Exactly 10 digits
    - Starting digit: Must start with 6, 7, 8, or 9
    - Cannot start with 0 or 1-5
    - No alphabets, special characters, spaces, or decimals
    """
    if not mobile or not str(mobile).strip():
        return "Mobile Number is required."
    clean = str(mobile).strip()
    if any(c.isspace() for c in clean):
        return "Mobile number cannot contain spaces."
    if "." in clean:
        return "Mobile number cannot contain decimal values."
    if any(c.isalpha() for c in clean):
        return "Mobile number cannot contain alphabets."
    if not clean.isdigit():
        return "Mobile number cannot contain special characters (digits 0–9 only)."
    if len(clean) != 10:
        return "Mobile number must be exactly 10 digits."
    if clean.startswith("0"):
        return "Mobile number cannot start with 0. Must start with 6, 7, 8, or 9."
    if clean[0] in "12345":
        return "Mobile number cannot start with 1–5. Must start with 6, 7, 8, or 9."
    if clean[0] not in "6789":
        return "Mobile number must start with 6, 7, 8, or 9."
    return None


def validate_email_address(email: Optional[str]) -> Optional[str]:
    """
    Validates email address against the strict rules:
    - Required: Cannot be empty
    - Must contain @: Exactly one @ symbol
    - Username required: Text before @ cannot be empty, max 64 chars
    - Domain required: Text after @ cannot be empty, max 254 chars total
    - Must contain domain extension (e.g. .com, .in, .org)
    - No spaces
    - No consecutive dots ('..') in username or domain
    - Cannot start or end with a dot
    - Valid domain: letters, numbers, hyphens, and dots (no start/end hyphens)
    - No consecutive @
    """
    if not email or not str(email).strip():
        return "Email ID is required."
    clean = str(email).strip()
    if len(clean) > 254:
        return "Email address cannot exceed 254 characters."
    if any(c.isspace() for c in clean):
        return "Email address cannot contain spaces."
    at_count = clean.count("@")
    if at_count == 0:
        return "Email must contain an '@' symbol."
    if at_count > 1:
        return "Email must contain exactly one '@' symbol (no consecutive or duplicate '@')."

    username, domain = clean.split("@")

    # Username rules
    if not username:
        return "Email username (before @) cannot be empty."
    if len(username) > 64:
        return "Email username cannot exceed 64 characters."
    if username.startswith("."):
        return "Email username cannot start with a dot."
    if username.endswith("."):
        return "Email username cannot end with a dot."
    if ".." in username:
        return "Email cannot contain consecutive dots ('..')."
    if not re.match(r"^[a-zA-Z0-9._%+-]+$", username):
        return "Email username contains invalid characters."

    # Domain rules
    if not domain:
        return "Email domain (after @) cannot be empty."
    if domain.startswith("."):
        return "Email domain cannot start with a dot."
    if domain.endswith("."):
        return "Email domain cannot end with a dot."
    if ".." in domain:
        return "Email domain cannot contain consecutive dots ('..')."

    domain_parts = domain.split(".")
    if len(domain_parts) < 2:
        return "Email domain must include a domain extension (e.g. .com, .in, .org)."
    ext = domain_parts[-1]
    if not ext or len(ext) < 2 or not ext.isalpha():
        return "Email domain extension must be valid letters (e.g. .com, .in, .org)."
    for part in domain_parts:
        if not part:
            return "Email domain cannot contain empty segments."
        if not re.match(r"^[a-zA-Z0-9-]+$", part):
            return "Email domain can only contain letters, numbers, hyphens, and dots."
        if part.startswith("-") or part.endswith("-"):
            return "Email domain parts cannot start or end with a hyphen."

    return None


@app.post("/auth/register")
def register(req: RegisterRequest):
    """Register a new shipper account with secure password hashing and profile validation."""
    email_clean = req.email.strip().lower() if req.email else ""
    email_err = validate_email_address(email_clean)
    if email_err:
        raise HTTPException(status_code=400, detail=email_err)

    # Determine first name, surname, and full name
    first = req.first_name.strip() if req.first_name else ""
    last = req.surname.strip() if req.surname else ""
    
    if req.full_name and req.full_name.strip() and (not first or not last):
        parts = req.full_name.strip().split(" ", 1)
        first = first or parts[0]
        last = last or (parts[1] if len(parts) > 1 else parts[0])

    if not first or not last:
        raise HTTPException(status_code=400, detail="First Name and Surname are required.")

    # Validate names have NO digits/numbers and contain valid letters only
    if re.search(r"\d", first) or not re.match(r"^[a-zA-Z\s'-]+$", first):
        raise HTTPException(status_code=400, detail="First Name must contain letters only (no numbers or digits allowed).")
    if re.search(r"\d", last) or not re.match(r"^[a-zA-Z\s'-]+$", last):
        raise HTTPException(status_code=400, detail="Surname must contain letters only (no numbers or digits allowed).")

    name = f"{first} {last}".strip()

    # Validate mobile number: must be exactly 10 digits starting with 6, 7, 8, or 9
    phone_raw = req.mobile_number.strip() if req.mobile_number else ""
    mobile_err = validate_mobile_number(phone_raw)
    if mobile_err:
        raise HTTPException(status_code=400, detail=mobile_err)

    # Validate password length: minimum 6 characters
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters in length.")

    # Validate confirm password
    if req.confirm_password is not None and req.confirm_password != req.password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    existing = get_user_by_email(email_clean)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    pwd_hash, salt = hash_password(req.password)
    # Strictly enforce 'user' role for public shipper registration
    new_user = create_user(
        email=email_clean,
        password_hash=pwd_hash,
        salt=salt,
        full_name=name,
        role="user",
        company=req.company or "",
        phone=phone_raw,
        address=req.address or ""
    )

    token = create_access_token({
        "sub": new_user["id"],
        "email": new_user["email"],
        "role": new_user["role"],
        "name": new_user["full_name"]
    })

    return {
        "status": "success",
        "message": "Shipper account created successfully.",
        "token": token,
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "full_name": new_user["full_name"],
            "role": new_user["role"],
            "company": new_user["company"],
            "phone": new_user.get("phone", ""),
            "address": new_user.get("address", "")
        }
    }


@app.post("/auth/login")
def login(req: LoginRequest):
    """Authenticate user with email and password, returning JWT access token."""
    email_clean = req.email.strip().lower()
    user = get_user_by_email(email_clean)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No user account found with this email address. Please check your credentials or register a new account."
        )

    # Check if user account is deactivated
    user_status = (user.get("status") or "Active").strip().lower()
    if user_status in ["inactive", "deactivated"]:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated by the administrator. Please contact port administration (admin@gmail.com) to reactivate your account."
        )

    if not verify_password(req.password, user["password_hash"], user["salt"]):
        raise HTTPException(status_code=401, detail="Invalid email address or password.")

    update_last_login(user["id"])

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["full_name"]
    })

    return {
        "status": "success",
        "message": f"Welcome back, {user['full_name']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "company": user.get("company", ""),
            "phone": user.get("phone", ""),
            "address": user.get("address", "")
        }
    }


@app.get("/auth/me")
def get_profile(user: dict = Depends(get_current_user)):
    """Return current authenticated user profile."""
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "company": user.get("company", ""),
            "phone": user.get("phone", ""),
            "address": user.get("address", ""),
            "created_at": user["created_at"],
            "last_login": user.get("last_login")
        }
    }


# ==============================================================================
# USER DASHBOARD ENDPOINTS
# ==============================================================================

@app.get("/user/dashboard")
def user_dashboard(user: dict = Depends(get_current_user)):
    """Comprehensive user dashboard analytics, recent searches, and saved routes."""
    searches = get_user_searches(user["id"], limit=10)
    saved = get_saved_routes(user["id"])

    total_containers = sum(s.get("containers", 0) for s in searches)
    total_freight_quoted = sum(s.get("total_freight_usd", 0.0) or 0.0 for s in searches)

    return {
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "company": user.get("company", ""),
            "phone": user.get("phone", ""),
            "address": user.get("address", ""),
            "country": user.get("country", ""),
            "created_at": user.get("created_at", "")
        },
        "stats": {
            "total_searches": len(searches),
            "saved_routes_count": len(saved),
            "total_containers_quoted": total_containers,
            "total_freight_quoted": round(total_freight_quoted, 2)
        },
        "recent_searches": searches,
        "saved_routes": saved
    }


@app.put("/user/profile")
def update_profile(req: UserProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update commercial freight broker profile information."""
    updated = update_user_profile(
        user_id=user["id"],
        full_name=req.full_name,
        company=req.company or "",
        phone=req.phone or "",
        address=req.address or "",
        country=req.country or ""
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile.")
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": {
            "id": updated["id"],
            "email": updated["email"],
            "full_name": updated["full_name"],
            "role": updated["role"],
            "company": updated.get("company", ""),
            "phone": updated.get("phone", ""),
            "address": updated.get("address", ""),
            "country": updated.get("country", ""),
            "created_at": updated.get("created_at", "")
        }
    }


@app.post("/user/change-password")
def change_password(req: UserPasswordChangeRequest, user: dict = Depends(get_current_user)):
    """Verify current password and update to new password."""
    db_user = get_user_by_id(user["id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if not verify_password(req.current_password, db_user["password_hash"], db_user["salt"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    
    new_hash, new_salt = hash_password(req.new_password)
    update_user_password(user["id"], new_hash, new_salt)
    return {"status": "success", "message": "Password updated successfully."}


@app.get("/user/searches")
def user_searches(user: dict = Depends(get_current_user)):
    """All searches performed by user."""
    return {"searches": get_user_searches(user["id"], limit=50)}


@app.get("/user/saved-routes")
def list_user_saved_routes(user: dict = Depends(get_current_user)):
    """User bookmarked route recommendations."""
    return {"saved_routes": get_saved_routes(user["id"])}


@app.post("/user/saved-routes")
def create_saved_route(req: SavedRouteRequest, user: dict = Depends(get_current_user)):
    """Save a recommended route to user's saved list."""
    saved = save_route(user["id"], req.model_dump())
    return {"status": "success", "message": "Route saved successfully.", "saved_route": saved}


@app.delete("/user/saved-routes/{saved_id}")
def remove_saved_route(saved_id: int, user: dict = Depends(get_current_user)):
    """Remove a saved route from user's bookmarks."""
    deleted = delete_saved_route(user["id"], saved_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved route not found or unauthorized.")
    return {"status": "success", "message": "Saved route removed successfully."}


# ==============================================================================
# SHIPMENT BOOKING & TRACKING ENDPOINTS
# ==============================================================================

@app.post("/shipments/book")
def book_shipment(req: ShipmentBookingRequest, user: dict = Depends(get_current_user)):
    """
    Book a selected route for shipping.
    Creates booking record and initial 'Order Placed' tracking timeline event.
    """
    if not req.cargo_desc.strip():
        raise HTTPException(status_code=400, detail="Please provide a cargo description.")
    if not req.shipper_name.strip():
        raise HTTPException(status_code=400, detail="Please provide the shipper or booking contact name.")
    if not req.contact_phone.strip():
        raise HTTPException(status_code=400, detail="Please provide a contact phone number.")
    if not req.pickup_address.strip():
        raise HTTPException(status_code=400, detail="Please provide the cargo pickup address.")
    if not req.delivery_address.strip():
        raise HTTPException(status_code=400, detail="Please provide the cargo delivery address.")
    if not req.pickup_date.strip():
        raise HTTPException(status_code=400, detail="Please provide the expected pickup date.")

    booking = create_booking(req.model_dump(), user["id"], user["email"])
    if not booking:
        raise HTTPException(status_code=500, detail="Failed to save shipment booking in database.")

    return {
        "status": "success",
        "message": "Shipment booked successfully.",
        "booking": booking
    }


@app.get("/shipments/my-bookings")
def my_shipments(user: dict = Depends(get_current_user)):
    """Retrieve all shipment bookings belonging to the authenticated user."""
    bookings = get_user_bookings(user["id"])
    return {"bookings": bookings, "total": len(bookings)}


@app.get("/shipments/{booking_id}")
def get_shipment_details(booking_id: str, user: dict = Depends(get_current_user)):
    """
    Retrieve shipment details and complete tracking timeline.
    Security: Users can only view their own bookings; admins can view any booking.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    if user.get("role") != "admin" and booking["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access forbidden: You cannot view another user's booking.")

    timeline = get_tracking_history(booking_id)
    stages = get_stages_for_booking(booking)

    return {
        "booking": booking,
        "timeline": timeline,
        "stages": stages
    }


@app.delete("/shipments/{booking_id}")
@app.post("/shipments/{booking_id}/cancel")
def delete_user_shipment(booking_id: str, user: dict = Depends(get_current_user)):
    """User endpoint: Cancel own shipment booking without hard-deleting the record."""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")
    if user.get("role") != "admin" and booking["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access forbidden: You cannot cancel another user's booking.")

    if booking.get("current_status") in ["In Transit", "Delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel consignment once ocean transit or delivery has commenced.")

    canceller = user.get("full_name") or "Shipper"
    cancelled = cancel_booking(booking_id, cancelled_by=canceller, reason="Consignment cancelled by shipper")
    if not cancelled:
        raise HTTPException(status_code=500, detail="Failed to cancel shipment booking.")
    return {
        "status": "success",
        "message": f"Consignment '{booking_id}' has been cancelled successfully.",
        "booking_id": booking_id,
        "booking": cancelled
    }



# ==============================================================================
# ADMINISTRATOR DASHBOARD & DATASET MANAGEMENT
# ==============================================================================

@app.get("/admin/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    """Platform statistics and health monitoring for administrators."""
    stats = get_platform_stats(total_routes_count=len(route_agent.routes))
    stats["active_ports"] = len(get_all_ports())
    return stats


@app.get("/admin/users")
def admin_users(admin: dict = Depends(require_admin)):
    """List all registered users."""
    users = list_all_users()
    return {"users": users, "total": len(users)}


@app.post("/admin/users")
def admin_add_user(req: AdminUserCreateRequest, admin: dict = Depends(require_admin)):
    """Admin endpoint to create a new user or administrator."""
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")
    
    existing = get_user_by_email(clean_email)
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{clean_email}' already exists.")
    
    role = req.role.strip().lower()
    if role not in ["user", "admin"]:
        role = "user"

    pwd_hash, salt = hash_password(req.password)
    new_user = admin_create_user(
        email=clean_email,
        password_hash=pwd_hash,
        salt=salt,
        full_name=req.full_name.strip(),
        role=role,
        company=req.company or "",
        status=req.status or "Active"
    )
    return {
        "status": "success",
        "message": f"Account for {new_user['full_name']} created successfully.",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "full_name": new_user["full_name"],
            "role": new_user["role"],
            "company": new_user["company"],
            "status": new_user.get("status", "Active")
        }
    }


@app.put("/admin/users/{user_id}")
def admin_modify_user(user_id: int, req: AdminUserUpdateRequest, admin: dict = Depends(require_admin)):
    """Admin endpoint to update user details."""
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User account not found.")
    
    clean_email = req.email.strip().lower()
    if clean_email != target["email"].lower():
        existing = get_user_by_email(clean_email)
        if existing and existing["id"] != user_id:
            raise HTTPException(status_code=400, detail=f"Email '{clean_email}' is already in use.")

    role = req.role.strip().lower()
    if role not in ["user", "admin"]:
        role = target["role"]

    updated = admin_update_user(
        user_id=user_id,
        full_name=req.full_name.strip(),
        email=clean_email,
        role=role,
        company=req.company or "",
        status=req.status or "Active"
    )
    return {
        "status": "success",
        "message": "User updated successfully.",
        "user": {
            "id": updated["id"],
            "email": updated["email"],
            "full_name": updated["full_name"],
            "role": updated["role"],
            "company": updated["company"],
            "status": updated.get("status", "Active")
        }
    }


@app.put("/admin/users/{user_id}/status")
def admin_toggle_user_status(user_id: int, admin: dict = Depends(require_admin)):
    """Admin endpoint to toggle user between Active and Deactivated."""
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")
    
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User account not found.")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot deactivate an administrator account.")

    updated = toggle_user_status(user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")
    return {
        "status": "success",
        "message": f"User status changed to {updated['status']}.",
        "user": {
            "id": updated["id"],
            "email": updated["email"],
            "full_name": updated["full_name"],
            "status": updated.get("status", "Active")
        }
    }


@app.delete("/admin/users/{user_id}")
def admin_remove_user(user_id: int, admin: dict = Depends(require_admin)):
    """Admin endpoint to delete a user account."""
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")
    
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User account not found.")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an administrator account.")

    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete user account.")
    return {
        "status": "success",
        "message": f"User {target['email']} has been deleted."
    }


@app.get("/admin/activity")
def admin_activity(admin: dict = Depends(require_admin)):
    """Recent search and platform activity stream."""
    searches = get_recent_searches(limit=30)
    return {"activity": searches}


@app.get("/admin/routes")
def admin_list_routes(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    route_type: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """
    Search and paginated listing of routes in routes.csv.
    """
    df = route_agent.routes.copy()

    if search:
        s = search.strip().lower()
        df = df[
            df["origin"].str.lower().str.contains(s)
            | df["destination"].str.lower().str.contains(s)
            | df["route_id"].str.lower().str.contains(s)
        ]

    if route_type and route_type != "All":
        df = df[df["route_type"].str.lower() == route_type.strip().lower()]

    total_records = len(df)
    total_pages = max(1, math.ceil(total_records / limit))
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    sliced = df.iloc[start_idx:end_idx].to_dict(orient="records")

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "total_pages": total_pages,
        "routes": sliced
    }


@app.post("/admin/routes")
def admin_add_route(req: RouteRecordCreate, admin: dict = Depends(require_admin)):
    """Add a new route record to routes.csv and reload Route Agent."""
    df = route_agent.routes.copy()

    route_id = req.route_id or f"R{len(df) + 1:03d}"
    if route_id in df["route_id"].values:
        raise HTTPException(status_code=400, detail=f"Route ID {route_id} already exists.")

    new_row = {
        "route_id": route_id,
        "origin": req.origin.strip(),
        "destination": req.destination.strip(),
        "distance_nm": int(req.distance_nm),
        "transit_days": int(req.transit_days),
        "transshipments": int(req.transshipments),
        "route_type": req.route_type.strip(),
        "base_freight_usd": float(req.base_freight_usd)
    }

    df_new = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df_new.to_csv(route_agent.dataset_path, sep="\t", index=False)
    route_agent.reload_routes()

    return {
        "status": "success",
        "message": f"Route {route_id} added successfully.",
        "route": new_row
    }


@app.put("/admin/routes/{route_id}")
def admin_update_route(route_id: str, req: RouteRecordUpdate, admin: dict = Depends(require_admin)):
    """Update an existing route in routes.csv."""
    df = route_agent.routes.copy()
    mask = df["route_id"].astype(str).str.lower() == route_id.strip().lower()

    if not mask.any():
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found.")

    idx = df[mask].index[0]
    if req.origin is not None and req.origin.strip():
        df.at[idx, "origin"] = req.origin.strip()
    if req.destination is not None and req.destination.strip():
        df.at[idx, "destination"] = req.destination.strip()
    if req.distance_nm is not None:
        df.at[idx, "distance_nm"] = int(req.distance_nm)
    if req.transit_days is not None:
        df.at[idx, "transit_days"] = int(req.transit_days)
    if req.transshipments is not None:
        df.at[idx, "transshipments"] = int(req.transshipments)
    if req.route_type is not None:
        df.at[idx, "route_type"] = req.route_type.strip()
    if req.base_freight_usd is not None:
        df.at[idx, "base_freight_usd"] = float(req.base_freight_usd)

    df.to_csv(route_agent.dataset_path, sep="\t", index=False)
    route_agent.reload_routes()

    updated = df.iloc[idx].to_dict()
    return {
        "status": "success",
        "message": f"Route {route_id} updated successfully.",
        "route": updated
    }


@app.delete("/admin/routes/{route_id}")
def admin_delete_route(route_id: str, admin: dict = Depends(require_admin)):
    """Delete a route from routes.csv after administrator confirmation."""
    df = route_agent.routes.copy()
    mask = df["route_id"].astype(str).str.lower() == route_id.strip().lower()

    if not mask.any():
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found.")

    df_new = df[~mask]
    df_new.to_csv(route_agent.dataset_path, sep="\t", index=False)
    route_agent.reload_routes()

    return {
        "status": "success",
        "message": f"Route {route_id} deleted successfully.",
        "remaining_routes": len(df_new)
    }


# ==============================================================================
# ADMINISTRATOR SHIPMENT MANAGEMENT ENDPOINTS
# ==============================================================================

@app.get("/admin/shipments")
def admin_list_shipments(
    search: Optional[str] = None,
    status: Optional[str] = None,
    booking_status: Optional[str] = None,
    dispatch_status: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """
    Administrator endpoint: View all bookings across the platform.
    Supports search by Booking ID, shipper name, or port, and dedicated filtering by booking_status and dispatch_status.
    """
    bookings = get_all_bookings(
        search=search,
        booking_status=booking_status,
        dispatch_status=dispatch_status,
        status_filter=status
    )
    return {
        "bookings": bookings,
        "total": len(bookings)
    }


@app.get("/admin/shipments/pending")
def admin_pending_shipments(admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: View pending shipment requests queue for Operational Dashboard.
    """
    pending = get_pending_bookings()
    return {
        "pending_shipments": pending,
        "total": len(pending)
    }


@app.post("/admin/shipments/{booking_id}/approve")
def admin_approve_shipment(booking_id: str, admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: Approve a pending shipment booking.
    Transitions status to 'Approved' and sets dispatch status to 'Approved - Ready for Dispatch'.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    if booking.get("booking_status") != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve booking: current status is '{booking.get('booking_status')}'. Only 'Pending' bookings can be approved."
        )

    admin_name = admin.get("full_name", "Port Administrator")
    updated = approve_booking(booking_id, admin_name=admin_name)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to approve booking.")

    return {
        "status": "success",
        "message": f"Shipment {booking_id} has been approved successfully.",
        "booking": updated
    }


@app.post("/admin/shipments/{booking_id}/reject")
def admin_reject_shipment(
    booking_id: str,
    payload: Optional[dict] = None,
    admin: dict = Depends(require_admin)
):
    """
    Administrator endpoint: Reject a pending shipment booking with mandatory reason.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    if booking.get("booking_status") != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject booking: current status is '{booking.get('booking_status')}'. Only 'Pending' bookings can be rejected."
        )

    reason = (payload or {}).get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required.")

    admin_name = admin.get("full_name", "Port Administrator")
    updated = reject_booking(booking_id, admin_name=admin_name, reason=reason)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to reject booking.")

    return {
        "status": "success",
        "message": f"Shipment {booking_id} has been rejected.",
        "booking": updated
    }


DISPATCH_MILESTONES = [
    "Booking Confirmed",
    "Cargo Received at Origin Port",
    "Loaded onto Vessel",
    "In Transit",
    "Arrived at Destination Port",
    "Delivered"
]

def get_next_dispatch_milestone(current_dispatch_status: str) -> Optional[str]:
    curr = (current_dispatch_status or "").strip()
    if curr in ["Pending", "Pending Approval", "Booking Confirmed", "Order Placed", "Approved", "Approved - Ready for Dispatch"]:
        return "Cargo Received at Origin Port"
    if curr in ["Cargo Received at Origin Port", "Cargo Received at Port"]:
        return "Loaded onto Vessel"
    if curr == "Loaded onto Vessel":
        return "In Transit"
    if curr == "In Transit":
        return "Arrived at Destination Port"
    if curr == "Arrived at Destination Port":
        return "Delivered"
    if curr == "Delivered":
        return None
    try:
        idx = DISPATCH_MILESTONES.index(curr)
        if idx < len(DISPATCH_MILESTONES) - 1:
            return DISPATCH_MILESTONES[idx + 1]
        return None
    except ValueError:
        return "Cargo Received at Origin Port"


@app.post("/admin/shipments/{booking_id}/update-status")
def admin_update_shipment_status(
    booking_id: str,
    req: ShipmentStatusUpdateRequest,
    admin: dict = Depends(require_admin)
):
    """
    Administrator endpoint: Update shipment stage, record status event, and remarks.
    Only authorized administrators can update shipment progress.
    Strictly restricts updates:
    - Only Approved shipments can advance.
    - Advance only to the next valid milestone in exact sequence.
    - Prevents skipping milestones.
    - Prevents moving backwards.
    - Prevents further updates after Delivered.
    """
    clean_status = req.status.strip()
    if clean_status not in DISPATCH_MILESTONES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dispatch milestone '{clean_status}'. Must be one of: {', '.join(DISPATCH_MILESTONES)}."
        )

    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    if booking.get("booking_status") != "Approved":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update dispatch for booking in '{booking.get('booking_status')}' status. Booking must be Approved first."
        )

    curr_disp = booking.get("dispatch_status") or "Booking Confirmed"
    if curr_disp == "Delivered":
        raise HTTPException(
            status_code=400,
            detail="Shipment has already been Delivered. No further dispatch updates are permitted."
        )

    if booking.get("booking_status") == "Cancelled" or "cancelled" in curr_disp.lower():
        raise HTTPException(
            status_code=400,
            detail="Cannot update dispatch for a cancelled shipment."
        )

    expected_next = get_next_dispatch_milestone(curr_disp)
    if not expected_next:
        raise HTTPException(
            status_code=400,
            detail="Shipment has completed all dispatch stages."
        )

    if clean_status != expected_next:
        raise HTTPException(
            status_code=400,
            detail=f"Milestone progression is restricted to sequential order: Current milestone is '{curr_disp}'. The next valid milestone is '{expected_next}'. Skipping milestones or moving backwards is strictly prohibited."
        )

    admin_name = admin.get("full_name") or "Administrator"
    server_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_remark = req.remarks.strip() if req.remarks else ""
    remark_type = "admin" if user_remark else "system"

    updated = add_tracking_event(
        booking_id=booking_id,
        status=clean_status,
        remarks=user_remark,
        updated_by=admin_name if user_remark else "System",
        timestamp=server_time,
        intermediate_port="",
        remark_type=remark_type
    )

    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update shipment status.")

    timeline = get_tracking_history(booking_id)

    return {
        "status": "success",
        "message": f"Shipment {booking_id} status updated to '{clean_status}'.",
        "booking": updated,
        "timeline": timeline
    }


@app.post("/admin/shipments/{booking_id}/cancel")
def admin_cancel_shipment(
    booking_id: str,
    payload: Optional[dict] = None,
    admin: dict = Depends(require_admin)
):
    """
    Administrator endpoint: Cancel an approved shipment booking with mandatory reason.
    Records administrator name and timestamp, adds cancellation event to tracking timeline,
    and prevents further dispatch updates.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    if booking.get("dispatch_status") == "Delivered":
        raise HTTPException(status_code=400, detail="Cannot cancel shipment that has already been Delivered.")

    if booking.get("booking_status") == "Cancelled":
        raise HTTPException(status_code=400, detail="Shipment has already been cancelled.")

    reason = (payload or {}).get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Cancellation reason is required.")

    admin_name = admin.get("full_name") or "Administrator"
    cancelled = cancel_booking(booking_id, cancelled_by=admin_name, reason=reason, is_admin=True)
    if not cancelled:
        raise HTTPException(status_code=500, detail="Failed to cancel shipment.")

    return {
        "status": "success",
        "message": f"Shipment {booking_id} has been cancelled by Administrator.",
        "booking": cancelled
    }


@app.delete("/admin/shipments/{booking_id}")
def admin_delete_shipment(booking_id: str, admin: dict = Depends(require_admin)):
    """
    Administrator endpoint: Permanently delete a shipment booking and its timeline events.
    """
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    success = delete_booking(booking_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete shipment booking.")

    return {
        "status": "success",
        "message": f"Shipment {booking_id} has been permanently deleted.",
        "booking_id": booking_id
    }

