"""
Pydantic data schemas for Agentic Maritime Brokerage Platform.
"""

from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class RouteRequest(BaseModel):
    """Preserved existing model schema for Route Intelligence API."""
    origin: str
    destination: str
    cargo_type: str = "Standard Dry"
    containers: int = Field(default=1, ge=1)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    first_name: Optional[str] = ""
    surname: Optional[str] = ""
    mobile_number: Optional[str] = ""
    address: Optional[str] = ""
    confirm_password: Optional[str] = None
    role: str = "user"  # Public registration is restricted to 'user'
    company: Optional[str] = ""


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None


class SavedRouteRequest(BaseModel):
    route_id: str
    origin: str
    destination: str
    route_type: str = "Standard"
    distance_nm: int
    transit_days: int
    base_freight_usd: float
    route_score: float
    notes: Optional[str] = ""


class RouteRecordCreate(BaseModel):
    origin: str
    destination: str
    distance_nm: int = Field(gt=0)
    transit_days: int = Field(gt=0)
    transshipments: int = Field(ge=0)
    route_type: str = "Standard"
    base_freight_usd: float = Field(gt=0)
    route_id: Optional[str] = None


class RouteRecordUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    distance_nm: Optional[int] = None
    transit_days: Optional[int] = None
    transshipments: Optional[int] = None
    route_type: Optional[str] = None
    base_freight_usd: Optional[float] = None


class UserProfileUpdateRequest(BaseModel):
    full_name: str
    company: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    country: Optional[str] = ""


class UserPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class AdminUserCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "user"  # "user" or "admin"
    company: Optional[str] = ""
    status: Optional[str] = "Active"


class AdminUserUpdateRequest(BaseModel):
    full_name: str
    email: str
    role: str = "user"
    company: Optional[str] = ""
    status: Optional[str] = "Active"


class ShipmentBookingRequest(BaseModel):
    route_id: str
    origin: str
    destination: str
    cargo_desc: str
    cargo_type: str = "Standard Dry"
    containers: int = Field(default=1, ge=1)
    shipper_name: str
    contact_phone: str
    pickup_address: str
    delivery_address: str
    pickup_date: str
    transit_days: Optional[int] = 0
    distance_nm: Optional[int] = 0
    transshipments: Optional[int] = 0
    freight_usd: Optional[float] = 0.0
    intermediate_port: Optional[str] = ""


class ShipmentStatusUpdateRequest(BaseModel):
    status: str
    remarks: Optional[str] = ""
    timestamp: Optional[str] = None
    intermediate_port: Optional[str] = "" 
