"""
Cryptographic authentication and JWT token handling.
Uses standard library hashlib, hmac, secrets, and base64 for zero-dependency,
secure PBKDF2-HMAC-SHA256 password hashing and standard HS256 JWT tokens.
"""

import os
import json
import time
import hmac
import hashlib
import secrets
import base64
from typing import Optional, Dict, Any

# JWT Secret from environment or default dev key
JWT_SECRET = os.getenv("JWT_SECRET", "agentic-maritime-brokerage-super-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 60 * 60 * 24 * 7  # 7 days


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash a password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (hex_hash, hex_salt).
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    )
    return key.hex(), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verify password matches stored PBKDF2 hash using constant-time comparison."""
    calculated_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(calculated_hash, stored_hash)


def _base64url_encode(data: bytes) -> str:
    """Encode bytes to base64url string without padding."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(s: str) -> bytes:
    """Decode base64url string with padding restoration."""
    padding = "=" * (4 - (len(s) % 4)) if (len(s) % 4) != 0 else ""
    return base64.urlsafe_b64decode((s + padding).encode("utf-8"))


def create_access_token(payload: Dict[str, Any], expires_in: int = JWT_EXPIRATION_SECONDS) -> str:
    """Create a standard HS256 JWT token."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    now = int(time.time())
    
    token_payload = payload.copy()
    token_payload["iat"] = now
    token_payload["exp"] = now + expires_in
    
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify an HS256 JWT token. Returns payload or None if invalid/expired."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        
        # Verify expiration
        exp = payload.get("exp")
        if exp and int(time.time()) > exp:
            return None
        
        return payload
    except Exception:
        return None
