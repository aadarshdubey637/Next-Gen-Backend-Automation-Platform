"""
Tests for the Authentication system.
"""
import pytest
from app.auth.jwt_handler import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing():
    password = "SecureP@ss123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False


def test_access_token_creation():
    token = create_access_token({"sub": "user-123", "role": "admin"})
    assert isinstance(token, str)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_refresh_token_creation():
    token = create_refresh_token({"sub": "user-456"})
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-456"
    assert payload["type"] == "refresh"


def test_invalid_token():
    result = decode_token("invalid.token.here")
    assert result is None


def test_token_contains_expiry():
    token = create_access_token({"sub": "test"})
    payload = decode_token(token)
    assert "exp" in payload
