import os
import math
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
    UserPasswordChangeRequest
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
    log_search,
    get_user_searches,
    get_recent_searches,
    save_route,
    get_saved_routes,
    delete_saved_route,
    get_platform_stats,
    update_user_profile,
    update_user_password
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
# AUTHENTICATION ENDPOINTS
# ==============================================================================

@app.post("/auth/register")
def register(req: RegisterRequest):
    """Register a new user account with secure password hashing."""
    email_clean = req.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="A valid email address is required.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing = get_user_by_email(email_clean)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    pwd_hash, salt = hash_password(req.password)
    # Enforce USER role for public signup
    new_user = create_user(
        email=email_clean,
        password_hash=pwd_hash,
        salt=salt,
        full_name=req.full_name,
        role="user",
        company=req.company or ""
    )

    token = create_access_token({
        "sub": new_user["id"],
        "email": new_user["email"],
        "role": new_user["role"],
        "name": new_user["full_name"]
    })

    return {
        "status": "success",
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "full_name": new_user["full_name"],
            "role": new_user["role"],
            "company": new_user["company"]
        }
    }


@app.post("/auth/login")
def login(req: LoginRequest):
    """Authenticate user with email and password, returning JWT access token."""
    email_clean = req.email.strip().lower()
    user = get_user_by_email(email_clean)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email address or password.")

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
            "company": user["company"]
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
            "company": user["company"],
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
