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
    full_name: str
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
