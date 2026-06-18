import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt

# JWT configuration settings
SECRET_KEY = "supersecretkeyprocessinglibrarymanagementsystemproject"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Securely hashes a password using native SHA-256 with a static salt."""
    salt = b"library_salt_secure_system_iyd328"
    pwd_bytes = password.encode('utf-8')
    h = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt, 100000)
    return h.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against the stored secure hex string."""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a secure login token for session state verification."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt