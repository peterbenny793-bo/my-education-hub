"""Admin authentication.

Login exchanges a username/password for an opaque session token, which is
stored server-side (Redis, or the in-memory fallback in cache.py for local
dev) with a TTL. Every admin-only route is wrapped in @require_admin, which
checks that token on each request instead of trusting anything the client
claims about itself.
"""
import os
import hmac
import secrets
from functools import wraps
from flask import Blueprint, request, jsonify
from .sanitizer import clean
from .cache import cache_get, cache_set, cache_delete

auth_bp = Blueprint("auth", __name__)

ADMIN_USER = os.getenv("ADMIN_USERNAME", "mrbenny")
ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "@taukwebwaga123")

SESSION_TTL = 12 * 60 * 60   # a session stays alive for 12h after its last use
MAX_ATTEMPTS = 5             # failed logins allowed per IP before a lockout
LOCKOUT_WINDOW = 15 * 60     # length of that lockout, in seconds


def _client_ip():
    # Render/Vercel sit in front of the app, so the real caller IP (if any)
    # arrives via X-Forwarded-For rather than the socket's remote_addr.
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else (request.remote_addr or "unknown")


def _attempts_key(ip):
    return f"login_attempts:{ip}"


def _session_key(token):
    return f"admin_session:{token}"


def require_admin(view):
    """Route decorator: 401s unless a valid admin session token is presented."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else ""
        if not token or not cache_get(_session_key(token)):
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        cache_set(_session_key(token), True, SESSION_TTL)  # sliding expiry
        return view(*args, **kwargs)
    return wrapped


@auth_bp.route("/login", methods=["POST"])
def login():
    ip = _client_ip()
    attempts = cache_get(_attempts_key(ip)) or 0
    if attempts >= MAX_ATTEMPTS:
        return jsonify({"ok": False, "error": "Too many attempts. Try again in a few minutes."}), 429

    data = request.get_json(silent=True) or {}
    username = clean(data.get("username", ""), 50)
    password = data.get("password", "")

    valid = username == ADMIN_USER and hmac.compare_digest(password, ADMIN_PASS)
    if not valid:
        cache_set(_attempts_key(ip), attempts + 1, LOCKOUT_WINDOW)
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    cache_delete(_attempts_key(ip))
    token = secrets.token_urlsafe(32)
    cache_set(_session_key(token), True, SESSION_TTL)
    return jsonify({"ok": True, "token": token})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    header = request.headers.get("Authorization", "")
    token = header[7:] if header.startswith("Bearer ") else ""
    if token:
        cache_delete(_session_key(token))
    return jsonify({"ok": True})
